export class DateUtils {
    static addDays(date: Date, days: number) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static formatDate(d: Date) {
        
        var month = '' + (d.getMonth() + 1);
        var day = '' + d.getDate();
        var year = d.getFullYear();

        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;

        return [year, month, day].join('-');
    }

    static isValid(date: Date) {
        return (date instanceof Date && !isNaN(date.valueOf()))
    }

    static dateDifference(date1: Date, date2: Date) {
        const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        // @ts-ignore
        return Math.round(Math.abs((date1 - date2) / oneDay));
    }
}
