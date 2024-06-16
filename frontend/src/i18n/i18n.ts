import i18n from "i18next"
import enUsTrans from './locales/en.json'
import zhCnTrans from './locales/zh.json'
import {
    initReactI18next
} from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'; // 检测当前浏览器语言

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources:{
            en:{
                translation:enUsTrans
            },
            zh:{
                translation:zhCnTrans
            }
        },
        lng:navigator.language,
        fallbackLng:"zh",
        debug:false,
        interpolation:{
            escapeValue:false
        }
    })
export default i18n