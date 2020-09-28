let projectFolder = "dist"; // имя папки где будет собиратся сам проект (prod)
let sourceFolder = "src";   // имя папки в которой мы разрабатываем (dev)
let fs = require("fs");     // переменная для шрифтов (автодобавление)

let path = {
    build:{                                     // пути  для прода (dist)
        html: projectFolder + "/",              // путь это к файлу html
        css: projectFolder + "/css/",           // путь к dist/css
        js: projectFolder + "/js/",             // путь к dist/js
        img: projectFolder + "/img/",           // путь к dist/img
        fonts: projectFolder + "/fonts/",       // путь к dist/fonts
    },
    // приблизительно что то похожее надо сделать с исходниками папкой src
    src:{                                                                  // пути для dev
        html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"] ,// путь ко всем src/html
        css: sourceFolder + "/scss/style.scss",                            // путь к  src/SASS (css)

        // gulp должен обрабатывать только этот файл т.к он собирает все подключеные файлы

        js: sourceFolder + "/js/script.js",                                // путь к src/js
        //тоже самое с js (только файл script.js)
        img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",        // путь к src/img // все файлы картинок

        // /**/ -->мы слушаем все папки которые находятся тут
        // *.{jpg,png,svg,gif,ico,webp} --> название будет любое а разширение будет что то из этого
        // jpg,png,svg,gif,ico,webp

        fonts: sourceFolder + "/fonts/*.ttf",                              // путь к  src/fonts все файлы с ttf
    },

    watch:{                                     // отлавливает изменение и сразу что то выполняется
        html: sourceFolder + "/**/*.html",
                                                // отлавливаем за любыми подпапками и любыми файлами с разширение html
        css: sourceFolder + "/scss/**/*.scss",
                                                // Отлавливаем все файлы sass
        js: sourceFolder + "/js/**/*.js",
                                                // Отлавливаем все файлы js
        img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
                                                // Отлавливаем все файлы img
    },
    clean: "./" + projectFolder + "/"

    // отвечает за удаление если что то меняется оно старое удаляет и новое ставит
}// обьекты в котором будут находится пути к файлам и папкам

let{ src, dest } = require('gulp'),                       // создаем переменные которые подключаем
    gulp = require('gulp'),                               // прагин общий
    fileInclude = require("gulp-file-include"),           // подключаем для того чтоб он подключал html (header, content, footer)
    del = require("del"),                                 // при обновлении пусть автоматически все удаляет и заново записывается
    scss = require("gulp-sass"),                          // подключаем прагин sass
    autoprefixer = require("gulp-autoprefixer"),          // подключаем автопрефиксер
    group_media = require("gulp-group-css-media-queries"),// собирает разбрасанные цсс и медиафайлы в одно целое и ставит в конец файла
    clean_css = require("gulp-clean-css"),                // сжимает и чистит css на выходе
    rename = require("gulp-rename"),                      // для того чтоб отдавать красивый цсс заказчику
    uglify = require("gulp-uglify-es").default,           // прагин для сжатия js
    imagemin = require("gulp-imagemin"),                  // оптимизирует картинки (сжимает без потери качества)
    webp = require("gulp-webp"),                          // конвертирует изображение в формат webp
    webpHtml = require("gulp-webp-html"),                 // плагин для подгрузки изображений
    webpCss = require("gulp-webpcss"),                    // webp для css
    svgSprite = require("gulp-svg-sprite"),               //
    ttf2woff = require("gulp-ttf2woff"),                  //
    ttf2woff2 = require("gulp-ttf2woff2"),                //
    fonter = require("gulp-fonter");                      //


    browsersync = require("browser-sync").create();    //отвечает за автообновление

function browserSync(){                              // ф-ция для обновления на localhost:3000
    browsersync.init({
        server:{                                     // настройка сервера
            baseDir: "./" + projectFolder + "/"      // тут указываем базовую папку
        },
        port: 3000,                                  // порт в котором будет открыватся браузер
        notify:false                                 // чтоб не выходила табличка что браузер обновился
    });
}

function html(){                // подключение прагинов на html
    return src(path.src.html)   // обращение к исходникам

        // мы возвращаем src и дальше делаем что хотим в pipe
        .pipe(fileInclude())                // подключает все файлы (2)
        .pipe(webpHtml())                   // переделывает в webp
        .pipe(dest(path.build.html))        // тут происходит банальное копирование с src в dist(выгруска)
        .pipe(browsersync.stream())         // перезагрузка браузера
}

function css(){                             // подключение прагинов на css
    return src(path.src.css)                // обращение к исходникам
        .pipe(                              // переводит сас в цсс
            scss({                   // sass настройки
                outputStyle: "expanded"     // css разворачивался не сжатым а развернутым
        // чтоб его было удобно читать
                 })
            )
        .pipe(
            group_media()                   // групирует все медиа в css
        )

        .pipe(
            autoprefixer({                          // добавляет автоматически префиксы
                overrideBrowserslist: ["last 5 versions"], // префикс браузерам которые нужно поддерживать
                cascade: true                              // стиль написания автопрефиксора
            })
        )
        .pipe(webpCss())                                   //переводит css в webp
        .pipe(dest(path.build.css))                        //грубо говоря не сжатый цсс
        .pipe(clean_css())
        //  заливается сжатый цсс но он будет не удобно если надо будет менять
        //  поэтому нужно отдавать 2 файла (rename)
        .pipe(
            rename({
                extname: ".min.css" // добавляем в конце имени min.css
            })
        )
        // что происходит ?
        // получаем исходники , обрабатываем групируем , добавляем префиксы,
        //
        .pipe(dest(path.build.css))  // все это добавляем
        .pipe(browsersync.stream())  // обновим

}
function js(){
    return src(path.src.js)
        .pipe(fileInclude())
        .pipe(dest(path.build.js))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js" // добавляем в конце имени min.js
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())

}
function images(){
    return src(path.src.img)
        .pipe(    // webp не все браузеры поддерживают поэтому мы сохраняем оба
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,                      //?
                svgoPlugins: [{ removeViewBox: false}], // работа с svg
                interlaced: true,                       // работа с другими изображениями
                optimizationLevel: 0,// 0-7             // как сильно хотим сжать изображение (нихрена не меняется)
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())

}
function fonts(){
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}
gulp.task('otf2ttf', function (){                   // переделывает формат otf  в ttf
    return src([sourceFolder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(sourceFolder + '/fonts/'))

});

gulp.task('svgSprite', function (){                         //функция чтобы получить все иконки svg
    return gulp.src([sourceFolder + '/iconsprite/*.svg'])   // функция которую надо вызывать отдельно
        .pipe(svgSprite({
            mode:{
                stack:{
                    sprite: "../icons/icons.svg",
                    // куда будет выводится готовый спрайт
                    example: true
                }
            }
        }))
        .pipe(dest(path.build.img))
});

function fontsStyle() {
    let file_content = fs.readFileSync(sourceFolder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(sourceFolder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}
function cb() { }

function watchFiles(param){
    gulp.watch([path.watch.html],html); // слежка за изменениями html
    gulp.watch([path.watch.css],css);   // слежка за изменениями css
    gulp.watch([path.watch.js],js);   // слежка за изменениями js
    gulp.watch([path.watch.img],images);   // слежка за изменениями js
}
function clean(){
    return del(path.clean);
}


let build = gulp.series(clean,gulp.parallel(js,css,html,images,fonts), fontsStyle); // сначало все удаляет потом добавлет ...
let watch = gulp.parallel(build,watchFiles,browserSync) ; // перекидываем функцию сюда

//также нужно подружить gulp с новыми переменными и для этого используется
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;

//прагины которые мы устанавливаем
/**
 * 1) npm i browser-sync --save-dev
 * --> будет обновлять страницу
 * 2) npm i gulp-file-include --save-dev
 * -->для того чтоб он подключал html (header ,content,footer)
 * также он может передавать что угодно
 *
 * 3) watchFiles это то что следит за изменениями файлов
 *  есть проблема что нам не нужно перекидывать header и как это можно сделать ?
 *  мы то что нам не нужно копировать называем _header ("!" + sourceFolder + "/_*.html")
 *
 * 4)npm i del --save-dev
 * --> при обновлении пусть автоматически все удаляет и заново записывается
 *
 *
 * РАБОТА С scss (css)
 * 5) npm i gulp-sass --save-dev
 * --> подключение сасс
 * 6) npm i gulp-autoprefixer --save-dev
 * --> добавляет автоматически префиксы
 * 7) npm i --save-dev gulp-group-css-media-queries
 * --> он собирает разбрасанные цсс и медиафайлы в одно целое и ставит в конец файла
 * 8) npm i gulp-clean-css --save-dev
 * --> сжимает и чистит css на выходе
 * 9) npm i gulp-rename --save-dev
 * --> для того чтоб отдавать красивый цсс заказчику
 *
 *
 * Работа с JS
 * 10) npm i gulp-uglify-es --save-dev
 * --> прагин для сжатия js
 * дз поставить babel (тема с версиями )
 * посмотреть настройки как делались
 *
 *
 * Работа со шрифтами и картинками img, fonts
 * 11) npm i gulp-imagemin --save-dev
 * -->оптимизирует картинки (сжимает без потери качества)
 * 2.9 сжал до 2.11
 *
 * 12) npm i gulp-webp --save-dev
 * --> конвертирует изображение в формат webp
 *
 * 13) npm i gulp-webp-html
 * --> плагин для подгрузки изображений
 * не нужно создавать picture sourse и тд
 *
 * Дополнительно обработка стилей
 * 14) npm i gulp-webpcss --save-dev
 * --> webp для css
 *
 * 15) npm i gulp-svg-sprite --save-dev
 * --> грипировка картинок svg
 *
 *
 * последняя тема конвертация шрифтов (fonts)
 * 16) npm i gulp-ttf2woff gulp-ttf2woff2 --save-dev
 *  --> устанавливаем 2 плагина
 *  --> ttf to woff
 *  --> ttf to woff2
 *
 * 17) npm i gulp-fonter --save-dev
 * --> плагин для переработки oft файлов
 *подключение шрифтов автоматически
 * // без прагинов с настройками в цсс
 *
 * ///////////////////////////////////////
 * как создать новый проект ?
 * создаем новую папку
 * перекопируем src , gulpfile.js, package.json
 * в терминале запускаем npm i
 * */