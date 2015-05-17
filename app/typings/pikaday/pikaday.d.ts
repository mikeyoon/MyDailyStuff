declare module 'pikaday' {
    interface PikadayConfig {
        field?: any;
        format?: string;
        onSelect?: Function;
        container?: any;
    }

    class Pikaday {
        constructor(options: PikadayConfig);

        el: HTMLElement;

        toString(format: string): string;
        getDate(): Date;
        setDate(date: string): void;
        //getMoment(): Moment;

        gotoToday(): void;
        gotoMonth(month: Number): void;
        nextMonth(): void;
        prevMonth(): void;
        gotoYear(year: Number): void;
        setMinDate(date: Date): void;
        setMaxDate(date: Date): void;

        isVisible(): boolean;
        show(): void;
        adjustPosition(): void;
        hide(): void;
        destroy(): void;
    }

    export = Pikaday;
}
