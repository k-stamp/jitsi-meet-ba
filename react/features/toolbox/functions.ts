import { IReduxState } from '../app/types';

/**
 * Gets the current sound option from the Redux state.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {string} The current sound option.
 */
export function getSoundOption(state: IReduxState): string {
    return state['features/toolbox']?.soundOption || 'default';
} 