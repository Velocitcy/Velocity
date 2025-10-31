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

import { findByCodeLazy, findByPropsLazy } from "@webpack";
import { Popout, React } from "@webpack/common";

const EmojiStore = findByPropsLazy("getByName", "convertSurrogateToName");
const CustomEmojiStore = findByPropsLazy("getCustomEmojiById");
const EmojiUtils = findByPropsLazy("getURL", "isCustomEmoji");
const EmojiPopoutComponent = findByCodeLazy("primaryEmoji", "emojiSection");

export function Emoji(props: { name: string; id?: string; animated?: boolean; }) {
    const { name, id, animated } = props;
    const targetRef = React.useRef(null);

    if (id) {
        const customEmoji = CustomEmojiStore.getCustomEmojiById(id);

        if (!customEmoji) {
            return <span>:{name}:</span>;
        }

        const url = EmojiUtils.getURL(customEmoji);

        return (
            <Popout
                targetElementRef={targetRef}
                renderPopout={({ closePopout }) => (
                    <EmojiPopoutComponent
                        node={{
                            type: "customEmoji",
                            emojiId: customEmoji.id,
                            emojiName: customEmoji.name,
                            animated: customEmoji.animated
                        }}
                        guildEmoji={customEmoji}
                        closePopout={closePopout}
                    />
                )}
            >
                {popoutProps => (
                    <img
                        {...popoutProps}
                        ref={targetRef}
                        src={url}
                        alt={`:${customEmoji.name}:`}
                        draggable={false}
                        className="emoji"
                        style={{
                            width: "1.375em",
                            height: "1.375em",
                            verticalAlign: "middle",
                            objectFit: "contain",
                            cursor: "pointer"
                        }}
                    />
                )}
            </Popout>
        );
    }

    const emojiData = EmojiStore.getByName(name);

    if (!emojiData) {
        return <span>{name}</span>;
    }

    return (
        <Popout
            targetElementRef={targetRef}
            renderPopout={({ closePopout }) => (
                <EmojiPopoutComponent
                    node={{
                        type: "emoji",
                        surrogate: emojiData.surrogates,
                        src: emojiData.url,
                        jumboable: false,
                        name: name
                    }}
                    closePopout={closePopout}
                />
            )}
        >
            {popoutProps => (
                <img
                    {...popoutProps}
                    ref={targetRef}
                    src={emojiData.url}
                    alt={emojiData.surrogates}
                    draggable={false}
                    className="emoji"
                    style={{
                        width: "1.375em",
                        height: "1.375em",
                        verticalAlign: "middle",
                        objectFit: "contain",
                        cursor: "pointer"
                    }}
                />
            )}
        </Popout>
    );
}
