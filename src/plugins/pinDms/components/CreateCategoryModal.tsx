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

import { classNameFactory } from "@api/Styles";
import { ManaModalContent, ManaModalDivider, ManaModalFooter, ManaModalHeader, ManaModalRoot } from "@utils/manaModal";
import { ModalProps, openModalLazy } from "@utils/modal";
import { extractAndLoadChunksLazy, findComponentByCodeLazy } from "@webpack";
import { ColorPicker, Forms, TextInput, Toasts, useMemo, useState } from "@webpack/common";

import { DEFAULT_COLOR, SWATCHES } from "../constants";
import { categoryLen, createCategory, getCategory } from "../data";

interface ColorPickerWithSwatchesProps {
    defaultColor: number;
    colors: number[];
    value: number;
    disabled?: boolean;
    onChange(value: number | null): void;
    renderDefaultButton?: (props: any) => React.ReactNode;
    renderCustomButton?: (props: any) => React.ReactNode;
}

const ColorPickerWithSwatches = findComponentByCodeLazy<ColorPickerWithSwatchesProps>('id:"color-picker"');

export const requireSettingsMenu = extractAndLoadChunksLazy(['name:"UserSettings"'], /createPromise:.{0,20}(\i\.\i\("?.+?"?\).*?).then\(\i\.bind\(\i,"?(.+?)"?\)\).{0,50}"UserSettings"/);

const cl = classNameFactory("vc-pindms-modal-");

interface Props {
    categoryId: string | null;
    initialChannelId: string | null;
    modalProps: ModalProps;
}

function useCategory(categoryId: string | null, initalChannelId: string | null) {
    const category = useMemo(() => {
        if (categoryId) {
            return getCategory(categoryId);
        } else if (initalChannelId) {
            return {
                id: Toasts.genId(),
                name: `Pin Category ${categoryLen() + 1}`,
                color: DEFAULT_COLOR,
                collapsed: false,
                channels: [initalChannelId]
            };
        }
    }, [categoryId, initalChannelId]);

    return category;
}

export function NewCategoryModal({ categoryId, modalProps, initialChannelId }: Props) {
    const category = useCategory(categoryId, initialChannelId);
    if (!category) return null;

    const [name, setName] = useState(category.name);
    const [color, setColor] = useState(category.color);

    const onSave = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();

        category.name = name;
        category.color = color;

        if (!categoryId) {
            createCategory(category);
        }

        modalProps.onClose();
    };

    return (
        <ManaModalRoot {...modalProps} size="md" paddingSize="sm">
            <ManaModalHeader
                title={`${categoryId ? "Edit" : "New"} Category`}
            />
            <ManaModalDivider />

            <form onSubmit={onSave}>
                <ManaModalContent className={cl("content")}>
                    <section>
                        <Forms.FormTitle>Name</Forms.FormTitle>
                        <TextInput
                            value={name}
                            onChange={e => setName(e)}
                        />
                    </section>
                    <section style={{ paddingTop: "5px" }}>
                        <Forms.FormTitle>Color</Forms.FormTitle>
                        <div style={{ overflowX: "hidden" }}>
                            <ColorPickerWithSwatches
                                key={category.id}
                                defaultColor={DEFAULT_COLOR}
                                colors={SWATCHES}
                                onChange={c => setColor(c!)}
                                value={color}
                                renderDefaultButton={() => (
                                    <ColorPicker
                                        color={color}
                                        onChange={c => setColor(c!)}
                                        key={category.id}
                                        showEyeDropper={true}
                                    />
                                )}
                                renderCustomButton={() => null}
                            />
                        </div>
                    </section>
                </ManaModalContent>
                <ManaModalDivider />
                <ManaModalFooter
                    actions={[
                        {
                            text: "Cancel",
                            variant: "secondary",
                            onClick: modalProps.onClose
                        },
                        {
                            text: categoryId ? "Save Catergory" : "Create Catergory",
                            variant: "primary",
                            onClick: onSave,
                            disabled: !name
                        }
                    ]}
                />
            </form>
        </ManaModalRoot>
    );
}

export const openCategoryModal = (categoryId: string | null, channelId: string | null) =>
    openModalLazy(async () => {
        await requireSettingsMenu();
        return modalProps => <NewCategoryModal categoryId={categoryId} modalProps={modalProps} initialChannelId={channelId} />;
    });
