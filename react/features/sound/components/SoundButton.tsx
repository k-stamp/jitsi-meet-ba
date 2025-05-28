import React, { useCallback, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { IconVolumeUp } from '../../base/icons/svg';
import ToolboxButtonWithPopup from '../../base/toolbox/components/web/ToolboxButtonWithPopup';
import AbstractButton, { type IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import ContextMenu from '../../base/ui/components/web/ContextMenu';
import ContextMenuItem from '../../base/ui/components/web/ContextMenuItem';
import ContextMenuItemGroup from '../../base/ui/components/web/ContextMenuItemGroup';

import logger from '../logger';

const OPTIONS = ['default', 'equalpower', 'hrtf'];

interface IProps extends WithTranslation, AbstractButtonProps {}

class SoundIconButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.sound';
    override icon = IconVolumeUp;
    override label = 'toolbar.sound';
    override tooltip = 'toolbar.sound';
}

function SoundButton({ t }: IProps) {
    const [ isOpen, setIsOpen ] = useState(false);
    const [ option, setOption ] = useState('default');

    const onOpen = useCallback(() => setIsOpen(true), []);
    const onClose = useCallback(() => setIsOpen(false), []);
    const onSelect = useCallback((opt: string) => {
        setOption(opt);
        logger.info(`Sound option selected: ${opt}`);
        // eslint-disable-next-line no-console
        console.log('Sound option selected:', opt);
        onClose();
    }, [ onClose ]);

    const getKey = (opt: string) => `toolbar.sound${opt.charAt(0).toUpperCase()}${opt.slice(1)}`;

    const menu = (
        <ContextMenu
            accessibilityLabel = { t('toolbar.sound') }
            hidden = { false }
            id = 'sound-context-menu'>
            <ContextMenuItemGroup>
                {OPTIONS.map(opt => (
                    <ContextMenuItem
                        accessibilityLabel = { t(getKey(opt)) }
                        key = { opt }
                        onClick = { () => onSelect(opt) }
                        selected = { option === opt }
                        text = { t(getKey(opt)) } />
                ))}
            </ContextMenuItemGroup>
        </ContextMenu>
    );

    return (
        <ToolboxButtonWithPopup
            ariaLabel = { t('toolbar.accessibilityLabel.sound') }
            onPopoverClose = { onClose }
            onPopoverOpen = { onOpen }
            popoverContent = { menu }
            visible = { isOpen }>
            <SoundIconButton />
        </ToolboxButtonWithPopup>
    );
}

export default translate(connect()(SoundButton));
