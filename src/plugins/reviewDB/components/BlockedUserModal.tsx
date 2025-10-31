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

import { Logger } from "@utils/Logger";
import { ModalCloseButton, ModalContent, ModalHeader, ModalRoot, openModal } from "@utils/modal";
import { useAwaiter } from "@utils/react";
import { Forms, Tooltip, useState } from "@webpack/common";

import { Auth } from "../auth";
import { ReviewDBUser } from "../entities";
import { fetchBlocks, unblockUser } from "../reviewDbApi";
import { cl } from "../utils";

function UnblockButton(props: { onClick?(): void; }) {
    return (
        <Tooltip text="Unblock user">
            {tooltipProps => (
                <div
                    {...tooltipProps}
                    role="button"
                    onClick={props.onClick}
                    className={cl("block-modal-unblock")}
                >
                    <svg height="20" viewBox="0 -960 960 960" width="20" fill="var(--status-danger)">
                        <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q54 0 104-17.5t92-50.5L228-676q-33 42-50.5 92T160-480q0 134 93 227t227 93Zm252-124q33-42 50.5-92T800-480q0-134-93-227t-227-93q-54 0-104 17.5T284-732l448 448Z" />
                    </svg>
                </div>
            )}
        </Tooltip>
    );
}

function BlockedUser({ user, isBusy, setIsBusy }: { user: ReviewDBUser; isBusy: boolean; setIsBusy(v: boolean): void; }) {
    const [gone, setGone] = useState(false);
    if (gone) return null;

    return (
        <div className={cl("block-modal-row")}>
            <img className={cl("block-modal-avatar")} src={user.profilePhoto} alt="" />
            <Forms.FormText className={cl("block-modal-username")}>{user.username}</Forms.FormText>
            <UnblockButton
                onClick={isBusy ? undefined : async () => {
                    setIsBusy(true);
                    try {
                        await unblockUser(user.discordID);
                        setGone(true);
                    } finally {
                        setIsBusy(false);
                    }
                }}
            />
        </div>
    );
}

function Modal() {
    const [isBusy, setIsBusy] = useState(false);
    const [blocks, error, pending] = useAwaiter(fetchBlocks, {
        onError: e => new Logger("ReviewDB").error("Failed to fetch blocks", e),
        fallbackValue: [],
    });

    if (pending)
        return null;
    if (error)
        return <Forms.FormText>Failed to fetch blocks: ${String(error)}</Forms.FormText>;
    if (!blocks.length)
        return <Forms.FormText>No blocked users.</Forms.FormText>;

    return (
        <>
            {blocks.map(b => (
                <BlockedUser
                    key={b.discordID}
                    user={b}
                    isBusy={isBusy}
                    setIsBusy={setIsBusy}
                />
            ))}
        </>
    );
}

export function openBlockModal() {
    openModal(modalProps => (
        <ModalRoot {...modalProps}>
            <ModalHeader className={cl("block-modal-header")}>
                <Forms.FormTitle style={{ margin: 0 }}>Blocked Users</Forms.FormTitle>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent className={cl("block-modal")}>
                {Auth.token ? <Modal /> : <Forms.FormText>You are not logged into ReviewDB!</Forms.FormText>}
            </ModalContent>
        </ModalRoot>
    ));
}
