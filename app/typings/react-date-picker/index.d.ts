/**
 * Created by myoon on 6/22/2015.
 */

declare module 'react-date-picker' {
    import React = require('react');
    import moment = require("~moment/moment");

    interface DatePickerProps {
        locale?: string;
        todayText?: string;
        gotoSelectedText?: string;
        weekStartDay?: number;
        weekDayNames?: (() => Array<string>)|Array<string>

        hideFooter?: boolean;
        hideHeader?: boolean;
        date?: Date;
        defaultDate?: Date;
        minDate?: Date;
        maxDate?: Date;
        dateFormat?: string;

        onChange?: (dateText: string, date: moment.Moment, ev: any) => void;
        onSelect?: (dateText: string, date: moment.Moment, view: any) => void;
        onNav?: (dateText: string, date: moment.Moment, view: any, direction: any) => void;
        onViewDateChange?: (dateText: string, date: moment.Moment, view: any) => void;
        onViewChange?: Function;

        renderDay?: () => HTMLElement;
        onRenderDay?: (dayProps: any) => void;
        views?: any;

        dayFormat?: string;
        monthFormat?: string;
        yearFormat?: string;

        defaultViewDate?: Date|string|moment.Moment|number;
        viewDate?: Date|string|moment.Moment|number;
        defaultView?: string;
        view?: string;
        navOnDateClick?: boolean;
    }

    class DatePicker extends React.Component<DatePickerProps, {}>
    {
    }

    export = DatePicker;
}



//import main = require('react-date-picker');

//
//declare var picker: main.DatePicker;



