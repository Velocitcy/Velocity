/*
 * Velocity, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { BaseText } from "@components/BaseText";
import * as Icons from "@components/Icons";
import { Devs } from "@utils/constants";
import { copyWithToast } from "@utils/misc";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { ContextMenuApi, Menu, React, TextInput, Tooltip, useState } from "@webpack/common";

const settings = definePluginSettings({
    keybind: {
        type: OptionType.STRING,
        description: "Keybind to open icons preview (format: ctrl+shift+key)",
        default: "ctrl+shift+i"
    }
});

function IconsPreviewModal({ modalProps }: { modalProps: ModalProps; }) {
    const [searchTerm, setSearchTerm] = useState("");

    const icons = Object.entries(Icons)
        .filter(([name, val]) => typeof val === "function" && name.endsWith("Icon"))
        .map(([name, component]) => ({
            name,
            icon: component,
            label: name.replace(/Icon$/, "").replace(/([A-Z])/g, " $1").trim()
        }));

    const filteredIcons = icons
        .filter(i => i.label.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.label.localeCompare(b.label));

    return (
        <ModalRoot {...modalProps} size={ModalSize.LARGE}>
            <ModalHeader>
                <BaseText size="xl" weight="semibold">Icons Preview</BaseText>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent style={{ padding: "16px" }}>
                <TextInput
                    value={searchTerm}
                    placeholder="Search icons..."
                    onChange={setSearchTerm}
                    autoFocus
                    style={{ marginBottom: "16px" }}
                />
                {filteredIcons.length === 0 ? (
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "200px"
                    }}>
                        <BaseText size="sm" style={{ color: "var(--text-muted)" }}>
                            No icons found
                        </BaseText>
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: "12px",
                        maxHeight: "400px",
                        overflowY: "auto"
                    }}>
                        {filteredIcons.map(({ name, icon: Icon, label }) => (
                            <Tooltip text="Click: Copy name\nRight-click: Options" key={name}>
                                {props => (
                                    <div
                                        {...props}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            padding: "12px",
                                            backgroundColor: "var(--background-secondary)",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            transition: "background-color 0.2s"
                                        }}
                                        onClick={() => copyWithToast(name)}
                                        onContextMenu={e => {
                                            e.preventDefault();
                                            ContextMenuApi.openContextMenu(e, () => (
                                                <Menu.Menu navId="icon-context" onClose={ContextMenuApi.closeContextMenu}>
                                                    <Menu.MenuItem
                                                        id="copy-name"
                                                        label="Copy Icon Name"
                                                        action={() => copyWithToast(name)}
                                                    />
                                                    <Menu.MenuItem
                                                        id="copy-import"
                                                        label="Copy Import Statement"
                                                        action={() => copyWithToast(`import { ${name} } from "@components/Icons";`)}
                                                    />
                                                </Menu.Menu>
                                            ));
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--background-modifier-hover)"}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--background-secondary)"}
                                    >
                                        <div>
                                            <Icon width={32} height={32} className={`vc-${label.toLowerCase().replace(/\s+/g, "-")}-icon`} style={{ marginBottom: "8px" }} />                                        </div>
                                        <BaseText size="xs" weight="medium" style={{ textAlign: "center", wordBreak: "break-word" }}>
                                            {label}
                                        </BaseText>
                                    </div>
                                )}
                            </Tooltip>
                        ))}
                    </div>
                )}
            </ModalContent>
        </ModalRoot>
    );
}

export default definePlugin({
    name: "viewVelocityIcons",
    description: "Preview all available Velocity icons with search functionality",
    authors: [Devs.Ven],
    settings,

    start() {
        const handleKeyPress = (e: KeyboardEvent) => {
            const keybind = settings.store.keybind.toLowerCase().split("+");
            const ctrl = keybind.includes("ctrl") ? e.ctrlKey : true;
            const shift = keybind.includes("shift") ? e.shiftKey : true;
            const key = keybind[keybind.length - 1];

            if (ctrl && shift && e.key.toLowerCase() === key) {
                e.preventDefault();
                openModal(props => <IconsPreviewModal modalProps={props} />);
            }
        };

        document.addEventListener("keydown", handleKeyPress);
        this.keyHandler = handleKeyPress;
    },

    stop() {
        if (this.keyHandler) {
            document.removeEventListener("keydown", this.keyHandler);
        }
    }
});
