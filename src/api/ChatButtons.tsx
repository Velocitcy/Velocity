/*
 * Velocity, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./ChatButton.css";

import ErrorBoundary from "@components/ErrorBoundary";
import { Logger } from "@utils/Logger";
import { classes } from "@utils/misc";
import { Channel } from "@velocity-types";
import { waitFor } from "@webpack";
import { ButtonWrapperClasses, Clickable, Tooltip } from "@webpack/common";
import { HTMLProps, JSX, MouseEventHandler, ReactNode } from "react";

let ChannelTextAreaClasses: Record<"button" | "buttonContainer", string>;
waitFor(["buttonContainer", "channelTextArea"], m => ChannelTextAreaClasses = m);

export interface ChatBarProps {
    channel: Channel;
    disabled: boolean;
    isEmpty: boolean;
    type: {
        analyticsName: string;
        attachments: boolean;
        autocomplete: {
            addReactionShortcut: boolean,
            forceChatLayer: boolean,
            reactions: boolean;
        },
        commands: {
            enabled: boolean;
        },
        drafts: {
            type: number,
            commandType: number,
            autoSave: boolean;
        },
        emojis: {
            button: boolean;
        },
        gifs: {
            button: boolean,
            allowSending: boolean;
        },
        gifts: {
            button: boolean;
        },
        permissions: {
            requireSendMessages: boolean;
        },
        showThreadPromptOnReply: boolean,
        stickers: {
            button: boolean,
            allowSending: boolean,
            autoSuggest: boolean;
        },
        users: {
            allowMentioning: boolean;
        },
        submit: {
            button: boolean,
            ignorePreference: boolean,
            disableEnterToSubmit: boolean,
            clearOnSubmit: boolean,
            useDisabledStylesOnSubmit: boolean;
        },
        uploadLongMessages: boolean,
        upsellLongMessages: {
            iconOnly: boolean;
        },
        showCharacterCount: boolean,
        sedReplace: boolean;
    };
}

export type ChatBarButtonFactory = (props: ChatBarProps & { isMainChat: boolean; }) => JSX.Element | null;

const buttonFactories = new Map<string, ChatBarButtonFactory>();
const logger = new Logger("ChatButtons");

export function _injectButtons(buttons: ReactNode[], props: ChatBarProps) {
    if (props.disabled) return;

    for (const [key, Button] of buttonFactories) {
        buttons.push(
            <ErrorBoundary noop key={key} onError={e => logger.error(`Failed to render ${key}`, e.error)}>
                <Button {...props} isMainChat={props.type.analyticsName === "normal"} />
            </ErrorBoundary>
        );
    }
}

export const addChatBarButton = (id: string, button: ChatBarButtonFactory) => buttonFactories.set(id, button);
export const removeChatBarButton = (id: string) => buttonFactories.delete(id);

export interface ChatBarButtonProps {
    children: ReactNode;
    tooltip: string;
    onClick: MouseEventHandler;
    onContextMenu?: MouseEventHandler;
    onAuxClick?: MouseEventHandler;
    buttonProps?: Omit<HTMLProps<HTMLDivElement>, "size" | "onClick" | "onContextMenu" | "onAuxClick">;
}
export const ChatBarButton = ErrorBoundary.wrap((props: ChatBarButtonProps) => {
    return (
        <Tooltip text={props.tooltip}>
            {({ onMouseEnter, onMouseLeave }) => (
                <div className={`expression-picker-chat-input-button ${ChannelTextAreaClasses?.buttonContainer ?? ""} vc-chatbar-button`}>
                    <Clickable
                        aria-label={props.tooltip}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        className={classes(ButtonWrapperClasses?.button, ChannelTextAreaClasses?.button)}
                        onClick={props.onClick}
                        onContextMenu={props.onContextMenu}
                        onAuxClick={props.onAuxClick}
                        {...props.buttonProps}
                    >
                        <div className={ButtonWrapperClasses?.buttonWrapper}>
                            {props.children}
                        </div>
                    </Clickable>
                </div>
            )}
        </Tooltip>
    );
}, { noop: true });
