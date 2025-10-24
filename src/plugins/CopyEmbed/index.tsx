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

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { CodeBlock } from "@components/CodeBlock";
import { Divider } from "@components/Divider";
import ErrorBoundary from "@components/ErrorBoundary";
import { CodeIcon, CopyIcon, LogIcon, NotesIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { Iconclasses, setIconClassName } from "@utils/icon";
import { Margins } from "@utils/margins";
import { copyWithToast } from "@utils/misc";
import { closeModal, ModalCloseButton, ModalContent, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Forms, Menu, React, Text, Toasts } from "@webpack/common";

function parseDiscordColor(colorValue: any): number | null {
    if (typeof colorValue === "number") return colorValue;
    if (typeof colorValue === "string") {
        if (colorValue.startsWith("#")) return parseInt(colorValue.slice(1), 16);
        const hexMatch = colorValue.match(/^[0-9A-Fa-f]{6}$/);
        if (hexMatch) return parseInt(colorValue, 16);

        const hslMatch = colorValue.match(/hsla?\((\d+),.*?(\d+(?:\.\d+)?)%.*?(\d+(?:\.\d+)?)%/);
        if (hslMatch) {
            const h = parseInt(hslMatch[1]) / 360;
            const s = parseFloat(hslMatch[2]) / 100;
            const l = parseFloat(hslMatch[3]) / 100;
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
            const g = Math.round(hue2rgb(p, q, h) * 255);
            const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
            return (r << 16) + (g << 8) + b;
        }
    }
    return null;
}

function cleanEmbed(embed: any) {
    const e: any = {};
    if (embed.title || embed.rawTitle) e.title = embed.title || embed.rawTitle;
    if (embed.description || embed.rawDescription) e.description = embed.description || embed.rawDescription;
    if (embed.url) e.url = embed.url;
    if (embed.color) {
        const parsedColor = parseDiscordColor(embed.color);
        if (parsedColor !== null) e.color = parsedColor;
    }
    if (embed.timestamp) e.timestamp = embed.timestamp;
    if (embed.footer) {
        e.footer = {};
        if (embed.footer.text || embed.footer.rawText) e.footer.text = embed.footer.text || embed.footer.rawText;
        if (embed.footer.iconURL || embed.footer.icon_url) e.footer.icon_url = embed.footer.iconURL || embed.footer.icon_url;
    }
    if (embed.author) {
        e.author = {};
        if (embed.author.name || embed.author.rawName) e.author.name = embed.author.name || embed.author.rawName;
        if (embed.author.url) e.author.url = embed.author.url;
        if (embed.author.iconURL || embed.author.icon_url) e.author.icon_url = embed.author.iconURL || embed.author.icon_url;
    }
    if (embed.thumbnail?.url) e.thumbnail = { url: embed.thumbnail.url };
    if (embed.image?.url) e.image = { url: embed.image.url };
    if (embed.fields?.length) {
        e.fields = embed.fields.map((f: any) => ({
            name: f.name || f.rawName || "",
            value: f.value || f.rawValue || "",
            inline: f.inline || false
        }));
    }
    return e;
}

function generateEmbedBuilder(embed: any): string {
    const lines = ["const embed = new EmbedBuilder()"];
    if (embed.title) lines.push(`  .setTitle(${JSON.stringify(embed.title)})`);
    if (embed.description) lines.push(`  .setDescription(${JSON.stringify(embed.description)})`);
    if (embed.color) lines.push(`  .setColor(${embed.color})`);
    if (embed.footer?.text) {
        const footerLines = [
            "  .setFooter({",
            `    text: ${JSON.stringify(embed.footer.text)}${embed.footer.icon_url ? "," : ""}`
        ];
        if (embed.footer.icon_url) footerLines.push(`    iconURL: ${JSON.stringify(embed.footer.icon_url)}`);
        footerLines.push("  })");
        lines.push(...footerLines);
    }
    if (embed.thumbnail?.url) lines.push(`  .setThumbnail(${JSON.stringify(embed.thumbnail.url)})`);
    if (embed.image?.url) lines.push(`  .setImage(${JSON.stringify(embed.image.url)})`);
    if (embed.author?.name) {
        const authorParts = [`    name: ${JSON.stringify(embed.author.name)}`];
        if (embed.author.icon_url) authorParts.push(`    iconURL: ${JSON.stringify(embed.author.icon_url)}`);
        if (embed.author.url) authorParts.push(`    url: ${JSON.stringify(embed.author.url)}`);
        lines.push(`  .setAuthor({\n${authorParts.join(",\n")}\n  })`);
    }
    if (embed.fields?.length) {
        embed.fields.forEach((f: any) => {
            lines.push(
                "  .addFields({",
                `    name: ${JSON.stringify(f.name)},`,
                `    value: ${JSON.stringify(f.value)},`,
                `    inline: ${f.inline}`,
                "  })"
            );
        });
    }
    lines[lines.length - 1] += ";";
    return lines.join("\n");
}

export function openEmbedRawModal(msg: any) {
    if (!msg?.embeds?.length) {
        Toasts.show({
            message: "No embeds in this message!",
            id: Toasts.genId(),
            type: Toasts.Type.FAILURE
        });
        return;
    }

    const cleanEmbeds = msg.embeds.map(cleanEmbed);
    const embedJson = JSON.stringify({ content: null, embeds: cleanEmbeds, attachments: [] }, null, 4);

    const key = openModal(props => (
        <ErrorBoundary>
            <ModalRoot {...props} size={ModalSize.LARGE}>
                <ModalHeader>
                    <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>View Raw Embeds</Text>
                    <ModalCloseButton withCircleBackground={false} onClick={() => closeModal(key)} />
                </ModalHeader>
                <ModalContent>
                    <div style={{ padding: "16px" }}>
                        {cleanEmbeds.map((embed, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <Divider className={Margins.top16 + " " + Margins.bottom16} />}
                                <Forms.FormTitle tag="h5">Embed {index + 1}</Forms.FormTitle>
                                <CodeBlock content={JSON.stringify(embed, null, 4)} lang="json" />
                            </React.Fragment>
                        ))}
                        {cleanEmbeds.length > 1 && (
                            <>
                                <Divider className={Margins.top16 + " " + Margins.bottom16} />
                                <Forms.FormTitle tag="h5">All Embeds Combined</Forms.FormTitle>
                                <CodeBlock content={embedJson} lang="json" />
                            </>
                        )}
                    </div>
                </ModalContent>
            </ModalRoot>
        </ErrorBoundary>
    ));
}

function copyEmbedData(msg: any) {
    if (!msg?.embeds?.length) {
        Toasts.show({
            message: "No embeds in this message!",
            id: Toasts.genId(),
            type: Toasts.Type.FAILURE
        });
        return;
    }
    const cleanEmbeds = msg.embeds.map(cleanEmbed);
    copyWithToast(JSON.stringify({ content: null, embeds: cleanEmbeds, attachments: [] }, null, 2), "Embed JSON copied!");
}

function copyFullMessageJSON(msg: any) {
    if (!msg) {
        Toasts.show({
            message: "No message data found!",
            id: Toasts.genId(),
            type: Toasts.Type.FAILURE
        });
        return;
    }
    copyWithToast(JSON.stringify(msg, null, 2), "Full message JSON copied!");
}

function copyEmbedDescription(msg: any) {
    if (!msg?.embeds?.length) {
        Toasts.show({
            message: "No embeds to copy!",
            id: Toasts.genId(),
            type: Toasts.Type.FAILURE
        });
        return;
    }
    const desc = msg.embeds[0].description || msg.embeds[0].rawDescription;
    if (!desc) {
        Toasts.show({
            message: "No description in first embed!",
            id: Toasts.genId(),
            type: Toasts.Type.FAILURE
        });
        return;
    }
    copyWithToast(desc, "Embed description copied!");
}

function copyEmbedBuilder(msg: any) {
    if (!msg?.embeds?.length) {
        Toasts.show({
            message: "No embeds in this message!",
            id: Toasts.genId(),
            type: Toasts.Type.FAILURE
        });
        return;
    }
    const cleanEmbeds = msg.embeds.map(cleanEmbed);
    const builderCode = cleanEmbeds.map(generateEmbedBuilder).join("\n\n");
    copyWithToast(builderCode, "EmbedBuilder code copied!");
}

const messageContextCallback: NavContextMenuPatchCallback = (children, props) => {
    if (!props?.message?.embeds?.length) return;
    if (!props.message.embeds.some((e: any) => e.type === "rich")) return;

    const group = findGroupChildrenByChildId("copy-link", children);

    if (group) {
        group.push(
            <Menu.MenuItem
                id="vc-embed-data"
                label="Embed Data"
                icon={setIconClassName(CodeIcon, Iconclasses.discord)}
            >
                <Menu.MenuItem
                    id="vc-copy-embed-data"
                    label="Copy Embed Data"
                    action={() => copyEmbedData(props.message)}
                    icon={setIconClassName(CodeIcon, Iconclasses.discord)}
                />
                <Menu.MenuItem
                    id="vc-copy-full-json"
                    label="Copy Full JSON"
                    action={() => copyFullMessageJSON(props.message)}
                    icon={setIconClassName(LogIcon, Iconclasses.discord)}
                />
                <Menu.MenuSeparator />
                <Menu.MenuItem
                    id="vc-copy-embed-description"
                    label="Copy Embed Description"
                    action={() => copyEmbedDescription(props.message)}
                    icon={setIconClassName(NotesIcon, Iconclasses.discord)}
                />
                <Menu.MenuItem
                    id="vc-copy-embed-builder"
                    label="Copy EmbedBuilder"
                    action={() => copyEmbedBuilder(props.message)}
                    icon={setIconClassName(CopyIcon, Iconclasses.discord)}
                />
                <Menu.MenuSeparator />
                <Menu.MenuItem
                    id="vc-view-raw-embed"
                    label="View Raw Embed"
                    action={() => openEmbedRawModal(props.message)}
                    icon={setIconClassName(LogIcon, Iconclasses.discord)}
                />
            </Menu.MenuItem>
        );
    }
};

export default definePlugin({
    name: "CopyEmbed",
    description: "Copy embed data, descriptions, and generate EmbedBuilder code from Discord messages",
    authors: [Devs.Velocity],

    contextMenus: {
        "message": messageContextCallback
    }
});
