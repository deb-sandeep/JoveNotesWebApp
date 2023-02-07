function NEGroup() {

    this.wordMeanings          = [] ;
    this.questionAnswers       = [] ;
    this.fibs                  = [] ;
    this.definitions           = [] ;
    this.characters            = [] ;
    this.teacherNotes          = [] ;
    this.matchings             = [] ;
    this.events                = [] ;
    this.trueFalseStatements   = [] ;
    this.chemEquations         = [] ;
    this.chemCompounds         = [] ;
    this.spellbeeWords         = [] ;
    this.imageLabels           = [] ;
    this.equations             = [] ;
    this.referenceToContexts   = [] ;
    this.multiChoiceQuestions  = [] ;
    this.voice2TextQuestions   = [] ;

    this.neFormatter = null ;

    this.setFormatter = function( neFormatter ) {
        this.neFormatter = neFormatter ;
    }

    this.reset = function() {

        this.wordMeanings.length          = 0 ;
        this.questionAnswers.length       = 0 ;
        this.fibs.length                  = 0 ;
        this.definitions.length           = 0 ;
        this.characters.length            = 0 ;
        this.teacherNotes.length          = 0 ;
        this.matchings.length             = 0 ;
        this.events.length                = 0 ;
        this.trueFalseStatements.length   = 0 ;
        this.chemEquations.length         = 0 ;
        this.chemCompounds.length         = 0 ;
        this.spellbeeWords.length         = 0 ;
        this.imageLabels.length           = 0 ;
        this.equations.length             = 0 ;
        this.referenceToContexts.length   = 0 ;
        this.multiChoiceQuestions.length  = 0 ;
        this.voice2TextQuestions.length   = 0 ;
    }

    this.addNote = function( element ) {

        var type = element.elementType ;

        if( type == NotesElementsTypes.prototype.WM ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatWM( element ) ;
                element.formatted = true ;
            }
            this.wordMeanings.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.QA ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatQA( element ) ;
                element.formatted = true ;
            }
            this.questionAnswers.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.FIB ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatFIB( element ) ;
                element.formatted = true ;
            }
            this.fibs.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.DEFINITION ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatDefinition( element ) ;
                element.formatted = true ;
            }
            this.definitions.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.CHARACTER ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatCharacter( element ) ;
                element.formatted = true ;
            }
            this.characters.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.MATCHING ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatMatching( element ) ;
                element.formatted = true ;
            }
            this.matchings.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.EVENT ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatEvent( element ) ;
                element.formatted = true ;
            }
            this.events.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.TRUE_FALSE ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatTrueFalse( element ) ;
                element.formatted = true ;
            }
            this.trueFalseStatements.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.CHEM_EQUATION ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatChemEquation( element ) ;
                element.formatted = true ;
            }
            this.chemEquations.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.CHEM_COMPOUND ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatChemCompound( element ) ;
                element.formatted = true ;
            }
            this.chemCompounds.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.SPELLBEE ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatSpellbeeWord( element ) ;
                element.formatted = true ;
            }
            this.spellbeeWords.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.IMAGE_LABEL ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatImageLabel( element ) ;
                element.formatted = true ;
            }
            this.imageLabels.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.EQUATION ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatEquation( element ) ;
                element.formatted = true ;
            }
            this.equations.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.REF_TO_CONTEXT ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatRTC( element ) ;
                element.formatted = true ;
            }
            this.referenceToContexts.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.MULTI_CHOICE ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatMultiChoiceQuestion( element ) ;
                element.formatted = true ;
            }
            this.multiChoiceQuestions.push( element ) ;
        }
        else if( type == NotesElementsTypes.prototype.VOICE2TEXT ) {
            if( !element.formatted ) {
                element = this.neFormatter.formatVoice2TextQuestion( element ) ;
                element.formatted = true ;
            }
            this.voice2TextQuestions.push( element ) ;
        }
    }
}