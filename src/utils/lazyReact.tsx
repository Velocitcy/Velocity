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

import type { ComponentType } from "react";

import { makeLazy } from "./lazy";

const NoopComponent = () => null;

export type LazyComponentWrapper<ComponentType> = ComponentType & { $$velocityGetWrappedComponent(): ComponentType; };

/**
 * A lazy component. The factory method is called on first render.
 * @param factory Function returning a Component
 * @param attempts How many times to try to get the component before giving up
 * @returns Result of factory function
 */
export function LazyComponent<T extends object = any>(factory: () => ComponentType<T>, attempts = 5): LazyComponentWrapper<ComponentType<T>> {
    const get = makeLazy(factory, attempts);
    const LazyComponent = (props: T) => {
        const Component = get() ?? NoopComponent;
        return <Component {...props} />;
    };

    LazyComponent.$$velocityGetWrappedComponent = get;

    return LazyComponent;
}
