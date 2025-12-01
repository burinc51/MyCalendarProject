import dayjs from 'dayjs';

const getDateFromIndex = (index: number) => {
    const baseDate = dayjs();
    const newDate = baseDate.add(index, 'month');
    return {
        year: newDate.year(),
        month: newDate.month()
    };
};

export default getDateFromIndex;
