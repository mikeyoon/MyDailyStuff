/**
 * Created by myoon on 6/22/2015.
 */
/// <reference path="../react/react.d.ts" />
declare module 'react-widgets' {
    interface DateTimePickerProps {
        value?: Date;
        onChange?: (date: Date, dateStr: string) => void;
        onSelect?: (date: Date) => void;

        calendar?: boolean;
        time?: boolean;
        min?: Date;
        max?: Date;

        format?: string;
        editFormat?: string;
        step?: number;
        parse?: Array<((str: string) => void)|Array<string>>
        initialView?: string;
        finalView?: string;
        open?: boolean|string;

        onToggle?: (isOpen: boolean) => void;
        duration?: number;
        isRtl?: boolean;

        messages?: any;
    }

    export class DateTimePicker extends React.Component<DateTimePickerProps, {}>
    {
    }
}