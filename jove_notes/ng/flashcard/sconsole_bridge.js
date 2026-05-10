function SConsoleBridge( baseUrl ) {

    const TIMEOUT_MS        = 3000 ;
    const MAX_RETRIES       = 2 ;
    const SESSION_TYPE      = "Theory" ;
    const EXTEND_INTERVAL_MS = 60000 ;

    let sconsoleSessionId = -1 ;
    let sessionStartTime  = -1 ;
    let lastExtendTime    = -1 ;

    this.startSession = function( chapterDetails, startTime ) {

        if( !baseUrl ) return ;

        sessionStartTime = startTime ;

        const payload = {
            sessionType      : SESSION_TYPE,
            topicId          : chapterDetails.chapterNumber,
            syllabusName     : "IIT " + chapterDetails.subjectName,
            startTime        : startTime,
            effectiveDuration: 0
        } ;

        callWithRetry( baseUrl + "/Session/StartSession", payload, MAX_RETRIES,
            function( data ) {
                sconsoleSessionId = data ;
                lastExtendTime    = Date.now() ;
                log.debug( "SConsoleBridge: session started, id=" + sconsoleSessionId ) ;
            },
            function( error ) {
                log.warn( "SConsoleBridge: StartSession failed, bridge disabled. " + error ) ;
            }
        ) ;
    } ;

    this.tick = function() {

        if( !baseUrl || sconsoleSessionId === -1 ) return ;
        if( Date.now() - lastExtendTime < EXTEND_INTERVAL_MS ) return ;

        extendSession() ;
    } ;

    function extendSession() {

        const now = Date.now() ;
        const payload = {
            sessionId                    : sconsoleSessionId,
            pauseId                      : 0,
            problemAttemptId             : 0,
            endTime                      : now,
            sessionEffectiveDuration     : Math.floor( ( now - sessionStartTime ) / 1000 ),
            problemAttemptEffectiveDuration: 0
        } ;

        callWithRetry( baseUrl + "/Session/ExtendSession", payload, MAX_RETRIES,
            function() {
                lastExtendTime = Date.now() ;
                log.debug( "SConsoleBridge: session extended." ) ;
            },
            function( error ) {
                log.warn( "SConsoleBridge: ExtendSession failed. " + error ) ;
            }
        ) ;
    } ;

    this.endSession = function() {

        if( !baseUrl || sconsoleSessionId === -1 ) return ;

        callWithRetry( baseUrl + "/Session/" + sconsoleSessionId + "/EndSession", null, MAX_RETRIES,
            function() {
                log.debug( "SConsoleBridge: session ended." ) ;
                sconsoleSessionId = -1 ;
            },
            function( error ) {
                log.warn( "SConsoleBridge: EndSession failed. " + error ) ;
            }
        ) ;
    } ;

    function callWithRetry( url, payload, retriesLeft, onSuccess, onFailure ) {

        const xhr = new XMLHttpRequest() ;
        xhr.open( "POST", url, true ) ;
        xhr.setRequestHeader( "Content-Type", "application/json" ) ;
        xhr.timeout = TIMEOUT_MS ;

        xhr.onload = function() {
            if( xhr.status >= 200 && xhr.status < 300 ) {
                try {
                    const response = JSON.parse( xhr.responseText ) ;
                    if( response.executionResult && response.executionResult.status === "OK" ) {
                        onSuccess( response.data ) ;
                    }
                    else {
                        retryOrFail( url, payload, retriesLeft, onSuccess, onFailure,
                            "Server returned error: " + xhr.responseText ) ;
                    }
                }
                catch( e ) {
                    retryOrFail( url, payload, retriesLeft, onSuccess, onFailure,
                        "JSON parse error: " + e ) ;
                }
            }
            else {
                retryOrFail( url, payload, retriesLeft, onSuccess, onFailure,
                    "HTTP " + xhr.status ) ;
            }
        } ;

        xhr.onerror   = function() { retryOrFail( url, payload, retriesLeft, onSuccess, onFailure, "Network error" ) ; } ;
        xhr.ontimeout = function() { retryOrFail( url, payload, retriesLeft, onSuccess, onFailure, "Timeout" ) ; } ;

        xhr.send( payload !== null ? JSON.stringify( payload ) : null ) ;
    }

    function retryOrFail( url, payload, retriesLeft, onSuccess, onFailure, reason ) {
        if( retriesLeft > 0 ) {
            log.debug( "SConsoleBridge: retrying (" + retriesLeft + " left). Reason: " + reason ) ;
            callWithRetry( url, payload, retriesLeft - 1, onSuccess, onFailure ) ;
        }
        else {
            onFailure( reason ) ;
        }
    }
}
