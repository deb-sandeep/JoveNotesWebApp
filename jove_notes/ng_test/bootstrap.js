var userName  = 'UTUser' ;
var chapterId = 23 ;
var log = null ;
var __debug__ = true ;

log = log4javascript.getLogger( "main" ) ;
var appender = new log4javascript.BrowserConsoleAppender() ;
var layout   = new log4javascript.PatternLayout( "[%-5p] %m" ) ;

appender.setLayout( layout ) ;
appender.setThreshold( log4javascript.Level.INFO ) ;

log.addAppender( appender ) ;
