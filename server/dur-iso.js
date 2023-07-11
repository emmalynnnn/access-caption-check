/*
Source: https://github.com/yflung/duration-iso-8601
Accessed: 4-21-23
License: MIT License

Copyright (c) 2017 yflung

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Bugs fixed by Emma Lynn.
*/

exports.convertDuration = (duration) => {
    if (typeof duration !== 'string') {
        return null;
    }

    // eslint-disable-next-line
    const numberRegExp = '\\d+(?:[\.,]\\d+)?';

    const durationRegExpS = `(?:(${numberRegExp})S)?)?`;
    const durationRegExpTM = `(?:(${numberRegExp})M)?`;
    const durationRegExpH = `(?:T(?:(${numberRegExp})H)?`;
    const durationRegExpD = `(?:(${numberRegExp})D)?`;
    const durationRegExpM = `(?:(${numberRegExp})M)?`;
    const durationRegExpY = `(?:(${numberRegExp})Y)?`;
    const durationRegExp = new RegExp(`^P${durationRegExpY}${durationRegExpM}${durationRegExpD}${durationRegExpH}${durationRegExpTM}${durationRegExpS}$`);

    const matchResult = duration.match(durationRegExp);

    if (matchResult === null) {
        return null;
    }

    let durationResult = {
        year: undefined,
        month: undefined,
        day: undefined,
        hour: undefined,
        minute: undefined,
        second: undefined,
    };

    for (let matchResultIndex = 0; matchResultIndex < matchResult.length; matchResultIndex++) {
        let value = matchResult[matchResultIndex];

        if (value !== undefined) {
            value = Number(matchResult[matchResultIndex].replace(',', '.'));
        }

        switch (matchResultIndex) {
            case 1:
                durationResult.year = value;
                break;
            case 2:
                durationResult.month = value;
                break;
            case 3:
                durationResult.day = value;
                break;
            case 4:
                durationResult.hour = value;
                break;
            case 5:
                durationResult.minute = value;
                break;
            case 6:
                durationResult.second = value;
                break;
            default:
                break;
        }
    }

    let isAllUndefined = true;

    Object.keys(durationResult).forEach((key) => {
        if (durationResult[key] !== undefined) {
            isAllUndefined = false;
        }
    });

    if (isAllUndefined) {
        return null;
    }

    return durationResult;
};

exports.convertToSecond = (duration) => {
    const durationResult = exports.convertDuration(duration);

    if (durationResult === null) {
        return null;
    }

    let second = 0;

    Object.keys(durationResult).forEach((key) => {
        if (durationResult[key] !== undefined) {
            switch (key) {
                case 'year':
                    second += durationResult[key] * 365 * 24 * 60 * 60;
                    break;
                case 'month':
                    second += durationResult[key] * 30 * 24 * 60 * 60;
                    break;
                case 'day':
                    second += durationResult[key] * 24 * 60 * 60;
                    break;
                case 'hour':
                    second += durationResult[key] * 60 * 60;
                    break;
                case 'minute':
                    second += durationResult[key] * 60;
                    break;
                case 'second':
                    second += durationResult[key];
                    break;
                default:
                    break;
            }
        }
    });

    return second;
};

exports.convertYouTubeDuration = (duration) => {
    let parsed = converter.convertDuration(duration);
    if (!parsed.hour) {
        parsed.hour = 0;
    }

    let formatted = "";

    if (parsed.year) {
        parsed.hour += (8760 * parsed.year);
    }
    if (parsed.month) {
        parsed.hour += (730 * parsed.month);
    }
    if (parsed.day) {
        parsed.hour += (24 * parsed.day);
    }

    if (parsed.hour) {
        if (parsed.hour.toString().length === 1) {
            formatted += ("0" + parsed.hour + ":");
        } else {
            formatted += (parsed.hour + ":");
        }
    } else {
        formatted += "00:";
    }

    if (parsed.minute) {
        if (parsed.minute.toString().length === 1) {
            formatted += ("0" + parsed.minute + ".");
        } else {
            formatted += (parsed.minute + ".");
        }
    } else {
        formatted += "00.";
    }

    if (parsed.second) {
        if (parsed.second.toString().length === 1) {
            formatted += ("0" + parsed.second);
        } else {
            formatted += parsed.second;
        }
    } else {
        formatted += "00";
    }

    return formatted;
};