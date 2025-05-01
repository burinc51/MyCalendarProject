// tailwind.config.js
module.exports = {
    content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        fontFamily: {
            sans: 'Kanit-Regular',
            'kanit-regular': 'Kanit-Regular',
            'kanit-bold': 'Kanit-Bold'
        }
    },
    plugins: []
};
