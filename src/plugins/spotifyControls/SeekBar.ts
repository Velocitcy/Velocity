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

import { LazyComponent } from "@utils/lazyReact";
import { Slider } from "@webpack/common";

export const SeekBar = LazyComponent(() => {
    const SliderClass = Slider.$$vencordGetWrappedComponent();

    // Discord's Slider does not update `state.value` when `props.initialValue` changes if state.value is not nullish.
    // We extend their class and override their `getDerivedStateFromProps` to update the value
    return class SeekBar extends SliderClass {
        static getDerivedStateFromProps(props: any, state: any) {
            const newState = super.getDerivedStateFromProps!(props, state);
            if (newState) {
                newState.value = props.initialValue;
            }

            return newState;
        }
    };
});
