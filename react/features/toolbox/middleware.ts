import { IStore } from '../app/types';
import { setAudioMode, getCurrentAudioMode } from '../base/media/audioContext';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import logger from '../base/media/logger';

import { SET_SOUND_OPTION } from './actionTypes';

/**
 * Implements the middleware of the toolbox feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_SOUND_OPTION:
        _handleSoundOptionChange(store, action.soundOption);
        break;
    }

    return next(action);
});

/**
 * Handles the sound option change and applies the corresponding audio processing.
 *
 * @param {Store} store - The Redux store instance.
 * @param {string} soundOption - The selected sound option.
 * @private
 * @returns {void}
 */
function _handleSoundOptionChange({ getState }: IStore, soundOption: string) {
    logger.info('Sound-Option wird geändert:', { 
        from: getCurrentAudioMode(), 
        to: soundOption 
    });

    try {
        // Use the centralized audio mode system
        setAudioMode(soundOption);
        
        // Log the change for debugging
        console.log(`Audio mode changed to: ${soundOption}`);
        
        // Additional mode-specific setup
        switch (soundOption) {
        case 'default':
            logger.info('Default Audio-Modus aktiviert - keine speziellen Effekte');
            break;
        case 'stereopanner':
            logger.info('StereoPanner Audio-Modus aktiviert');
            break;
        case 'equalpower':
            logger.info('Equalpower Audio-Modus aktiviert');
            // TODO: Implement equalpower-specific setup
            break;
        case 'hrtf':
            logger.info('HRTF Audio-Modus aktiviert');
            // TODO: Implement HRTF-specific setup
            break;
        default:
            logger.warn('Unbekannte Sound-Option:', soundOption);
        }
    } catch (error) {
        logger.error('Fehler beim Anwenden der Sound-Option:', error);
    }
} 