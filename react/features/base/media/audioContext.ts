import logger from './logger';

// AudioContext für die gesamte Anwendung
let audioContext: AudioContext | null = null;
let stereoPannerNode: StereoPannerNode | null = null;
let currentAudioMode: string = 'default';
let connectedSources: Set<AudioNode> = new Set();

/**
 * Erstellt und gibt den AudioContext zurück
 * @returns {AudioContext} Der AudioContext
 */
export function getAudioContext(): AudioContext {
    if (!audioContext) {
        try {
            audioContext = new AudioContext();
            logger.info('AudioContext erfolgreich erstellt', {
                sampleRate: audioContext.sampleRate,
                state: audioContext.state,
                baseLatency: audioContext.baseLatency
            });

            // Event-Listener für State-Änderungen
            audioContext.addEventListener('statechange', () => {
                logger.debug('AudioContext State geändert:', audioContext?.state);
            });

        } catch (error) {
            logger.error('Fehler beim Erstellen des AudioContext:', error);
            throw error;
        }
    }
    
    return audioContext;
}

/**
 * Erstellt und gibt die StereoPannerNode zurück
 * @param panValue - Der initiale Pan-Wert (-1 bis 1, wobei -1 = links, 0 = mitte, 1 = rechts)
 * @returns {StereoPannerNode} Die StereoPannerNode
 */
export function getStereoPannerNode(panValue: number = 0): StereoPannerNode {
    const context = getAudioContext();
    
    if (!stereoPannerNode) {
        try {
            // StereoPannerNode mit optionalem initialen Pan-Wert erstellen
            stereoPannerNode = context.createStereoPanner();
            
            // Pan-Wert setzen (zwischen -1 und 1)
            const clampedPanValue = Math.max(-1, Math.min(1, panValue));
            stereoPannerNode.pan.value = clampedPanValue;
            
            logger.info('StereoPannerNode erfolgreich erstellt', {
                panValue: stereoPannerNode.pan.value,
                numberOfInputs: stereoPannerNode.numberOfInputs,
                numberOfOutputs: stereoPannerNode.numberOfOutputs
            });

        } catch (error) {
            logger.error('Fehler beim Erstellen der StereoPannerNode:', error);
            throw error;
        }
    }
    
    return stereoPannerNode;
}

/**
 * Setzt den Pan-Wert der StereoPannerNode
 * @param panValue - Der Pan-Wert (-1 bis 1)
 * @param when - Zeitpunkt für die Änderung (optional, Standard: sofort)
 */
export function setPanValue(panValue: number, when?: number): void {
    const pannerNode = getStereoPannerNode();
    const clampedPanValue = Math.max(-1, Math.min(1, panValue));
    
    try {
        if (when !== undefined) {
            pannerNode.pan.setValueAtTime(clampedPanValue, when);
        } else {
            pannerNode.pan.value = clampedPanValue;
        }
        
        logger.debug('Pan-Wert gesetzt:', {
            panValue: clampedPanValue,
            when: when || 'sofort'
        });
    } catch (error) {
        logger.error('Fehler beim Setzen des Pan-Werts:', error);
        throw error;
    }
}

/**
 * Verbindet eine Audio-Quelle mit der StereoPannerNode und dem Destination
 * @param sourceNode - Die Audio-Quelle (z.B. MediaElementAudioSourceNode, AudioBufferSourceNode)
 * @param panValue - Optionaler Pan-Wert für die Initialisierung
 * @returns {StereoPannerNode} Die verwendete StereoPannerNode
 */
export function connectAudioThroughStereoPanner(
    sourceNode: AudioNode, 
    panValue: number = 0
): StereoPannerNode {
    const context = getAudioContext();
    const pannerNode = getStereoPannerNode(panValue);
    
    try {
        // Audio-Routing: Quelle -> StereoPanner -> Destination
        sourceNode.connect(pannerNode);
        pannerNode.connect(context.destination);
        
        // Track connected sources
        connectedSources.add(sourceNode);
        
        logger.info('Audio erfolgreich durch StereoPannerNode geroutet', {
            panValue: pannerNode.pan.value,
            sourceNodeType: sourceNode.constructor.name
        });
        
        return pannerNode;
    } catch (error) {
        logger.error('Fehler beim Routing durch StereoPannerNode:', error);
        throw error;
    }
}

/**
 * Trennt alle Verbindungen der StereoPannerNode
 */
export function disconnectStereoPanner(): void {
    if (stereoPannerNode) {
        try {
            stereoPannerNode.disconnect();
            logger.info('StereoPannerNode Verbindungen getrennt');
        } catch (error) {
            logger.error('Fehler beim Trennen der StereoPannerNode:', error);
        }
    }
}

/**
 * Gibt den aktuellen Pan-Wert zurück
 * @returns {number} Der aktuelle Pan-Wert (-1 bis 1)
 */
export function getCurrentPanValue(): number {
    if (stereoPannerNode) {
        return stereoPannerNode.pan.value;
    }
    return 0; // Standard-Wert wenn keine StereoPannerNode existiert
}

/**
 * Setzt den Audio-Verarbeitungsmodus
 * @param mode - Der Audio-Modus ('default', 'stereopanner', 'equalpower', 'hrtf')
 */
export function setAudioMode(mode: string): void {
    logger.info('Audio-Modus wird geändert:', { from: currentAudioMode, to: mode });
    
    try {
        // Disconnect all current connections
        _disconnectAllSources();
        
        currentAudioMode = mode;
        
        // Reconnect sources with new mode
        _reconnectSourcesWithMode(mode);
        
        logger.info('Audio-Modus erfolgreich geändert:', mode);
    } catch (error) {
        logger.error('Fehler beim Ändern des Audio-Modus:', error);
        throw error;
    }
}

/**
 * Gibt den aktuellen Audio-Modus zurück
 * @returns {string} Der aktuelle Audio-Modus
 */
export function getCurrentAudioMode(): string {
    return currentAudioMode;
}

/**
 * Verbindet eine Audio-Quelle basierend auf dem aktuellen Modus
 * @param sourceNode - Die Audio-Quelle
 */
export function connectAudioSource(sourceNode: AudioNode): void {
    const context = getAudioContext();
    
    try {
        connectedSources.add(sourceNode);
        
        switch (currentAudioMode) {
        case 'stereopanner':
            connectAudioThroughStereoPanner(sourceNode);
            break;
        case 'default':
        default:
            // Direct connection to destination
            sourceNode.connect(context.destination);
            logger.info('Audio direkt zum Destination geroutet (Default-Modus)');
            break;
        }
    } catch (error) {
        logger.error('Fehler beim Verbinden der Audio-Quelle:', error);
        throw error;
    }
}

/**
 * Trennt alle verbundenen Audio-Quellen
 * @private
 */
function _disconnectAllSources(): void {
    connectedSources.forEach(source => {
        try {
            source.disconnect();
        } catch (error) {
            logger.warn('Fehler beim Trennen einer Audio-Quelle:', error);
        }
    });
    
    // Disconnect stereo panner if it exists
    disconnectStereoPanner();
}

/**
 * Verbindet alle Audio-Quellen mit dem neuen Modus
 * @param mode - Der neue Audio-Modus
 * @private
 */
function _reconnectSourcesWithMode(mode: string): void {
    const context = getAudioContext();
    
    connectedSources.forEach(source => {
        try {
            switch (mode) {
            case 'stereopanner':
                connectAudioThroughStereoPanner(source);
                break;
            case 'default':
            default:
                source.connect(context.destination);
                break;
            }
        } catch (error) {
            logger.warn('Fehler beim Neuverbinden einer Audio-Quelle:', error);
        }
    });
}

/**
 * Initialisiert den AudioContext
 * @returns {AudioContext} Der initialisierte AudioContext
 */
export function initAudioContext(): AudioContext {
    logger.info('AudioContext wird initialisiert...');
    const context = getAudioContext();
    logger.info('AudioContext Initialisierung abgeschlossen');
    return context;
}
