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

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { CodeBlock } from "@components/CodeBlock";
import { Divider } from "@components/Divider";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { CodeIcon, CopyIcon, LogIcon } from "@components/Icons";
import { Message } from "@discord-types";
import { Devs } from "@utils/constants";
import { getCurrentGuild, getIntlMessage } from "@utils/discord";
import { Iconclasses, setIconClassName } from "@utils/icon";
import { Margins } from "@utils/margins";
import { copyWithToast } from "@utils/misc";
import { closeModal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, ChannelStore, Forms, GuildRoleStore, Menu, React, Text } from "@webpack/common";


function sortObject<T extends object>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).sort(([k1], [k2]) => k1.localeCompare(k2))) as T;
}

function cleanMessage(msg: Message) {
    const clone = sortObject(JSON.parse(JSON.stringify(msg)));
    for (const key of [
        "email",
        "phone",
        "mfaEnabled",
        "personalConnectionId"
    ]) delete clone.author[key];

    const cloneAny = clone as any;
    delete cloneAny.editHistory;
    delete cloneAny.deleted;
    delete cloneAny.firstEditTimestamp;
    cloneAny.attachments?.forEach(a => delete a.deleted);

    return clone;
}

function cleanUser(user: any) {
    const clone = sortObject(JSON.parse(JSON.stringify(user)));
    for (const key of [
        "email",
        "phone",
        "mfaEnabled",
        "personalConnectionId"
    ]) delete clone[key];

    return clone;
}

function makeNoteSpan(text: string, color: string) {
    return (
        <span style={{ color, fontSize: "12px", fontWeight: "600", marginLeft: "2px" }}>
            ({text})
        </span>
    );
}

function openViewRawModal(json: string, type: string, content?: string) {
    const key = openModal(props => (
        <ErrorBoundary>
            <ModalRoot {...props} size={ModalSize.LARGE}>
                <ModalHeader>
                    <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>View Raw</Text>
                    <ModalCloseButton onClick={() => closeModal(key)} />
                </ModalHeader>
                <ModalContent>
                    <div style={{ padding: "16px" }}>
                        {!!content && (
                            <>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                    <Forms.FormTitle tag="h5" style={{ margin: 0 }}>Content</Forms.FormTitle>
                                    {/[^\u0000-\u007f]/.test(content) && makeNoteSpan("Unicode", "#ff5555")}
                                    {/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u.test(content) && makeNoteSpan("Emoji", "#6fff00")}
                                    {/[\u0000]/.test(content) && makeNoteSpan("Invisible Unicode", "#888888")}
                                </div>
                                <CodeBlock content={content} />
                                <Divider className={Margins.bottom20} />
                            </>
                        )}

                        <Forms.FormTitle tag="h5">{type} Data</Forms.FormTitle>
                        <CodeBlock content={json} lang="json" />
                    </div>
                </ModalContent >
                <ModalFooter>
                    <Flex cellSpacing={10}>
                        <Button icon={CodeIcon()} onClick={() => copyWithToast(json, `${type} data copied to clipboard!`)}>
                            Copy {type} JSON
                        </Button>
                        {!!content && (
                            <Button icon={CopyIcon()} onClick={() => copyWithToast(content, "Content copied to clipboard!")}>
                                Copy Raw Content
                            </Button>
                        )}
                    </Flex>
                </ModalFooter>
            </ModalRoot >
        </ErrorBoundary >
    ));
}

function openViewRawModalMessage(msg: Message) {
    msg = cleanMessage(msg);
    const msgJson = JSON.stringify(msg, null, 4);

    return openViewRawModal(msgJson, "Message", msg.content);
}

function openViewRawModalUser(user: any) {
    user = cleanUser(user);
    const userJson = JSON.stringify(user, null, 4);

    return openViewRawModal(userJson, "User");
}

const messageContextCallback: NavContextMenuPatchCallback = (children, props) => {
    if (!props?.message) return;

    children.push(
        <Menu.MenuItem
            id="vc-view-message-raw"
            label="View Raw"
            action={() => openViewRawModalMessage(props.message)}
            icon={setIconClassName(LogIcon, Iconclasses.discord)}
        />
    );
};

function MakeContextCallback(name: "Guild" | "Role" | "User" | "Channel"): NavContextMenuPatchCallback {
    return (children, props) => {
        const value = props[name.toLowerCase()];
        if (!value) return;
        if (props.label === getIntlMessage("CHANNEL_ACTIONS_MENU_LABEL")) return;

        const lastChild = children.at(-1);
        if (lastChild?.key === "developer-actions") {
            const p = lastChild.props;
            if (!Array.isArray(p.children))
                p.children = [p.children];

            children = p.children;
        }

        children.splice(-1, 0,
            <Menu.MenuItem
                id={`vc-view-${name.toLowerCase()}-raw`}
                label="View Raw"
                action={() => {
                    if (name === "User") {
                        openViewRawModalUser(value);
                    } else {
                        openViewRawModal(JSON.stringify(value, null, 4), name);
                    }
                }}
                icon={setIconClassName(LogIcon, Iconclasses.discord)}
            />
        );
    };
}

const devContextCallback: NavContextMenuPatchCallback = (children, { id }: { id: string; }) => {
    const guild = getCurrentGuild();
    if (!guild) return;

    const role = GuildRoleStore.getRole(guild.id, id);
    if (!role) return;

    children.push(
        <Menu.MenuItem
            id={"vc-view-role-raw"}
            label="View Raw"
            action={() => openViewRawModal(JSON.stringify(role, null, 4), "Role")}
            icon={setIconClassName(LogIcon, Iconclasses.discord)}
        />
    );
};

export default definePlugin({
    name: "ViewRaw",
    description: "Copy and view the raw content/data of any message, user, channel or guild",
    authors: [Devs.KingFish, Devs.Ven, Devs.rad, Devs.ImLvna],

    contextMenus: {
        "guild-context": MakeContextCallback("Guild"),
        "guild-settings-role-context": MakeContextCallback("Role"),
        "channel-context": MakeContextCallback("Channel"),
        "thread-context": MakeContextCallback("Channel"),
        "message": messageContextCallback,
        "gdm-context": MakeContextCallback("Channel"),
        "user-context": MakeContextCallback("User"),
        "dev-context": devContextCallback
    },

    renderMessagePopoverButton(msg) {
        const channel = ChannelStore.getChannel(msg.channel_id);

        return {
            label: "View Raw",
            icon: () => setIconClassName(LogIcon, Iconclasses.popover)(),
            message: msg,
            channel,
            onClick: () => openViewRawModalMessage(msg)
        };
    }
});
