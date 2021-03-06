const Jimp = require('jimp');
const fs = require('fs')
const sleep = require('system-sleep');

var colors = {
    3698908415: 'STO', //    0xFFDC78DC , { r: 220, g: 120, b: 220, a: 255 }
    2027727615: 'ARTE', //  0xFF78DCAA , { r: 120, g: 220, b: 170, a: 255 }
    3698882815: 'SCI', // 0xFFDC7878, { r: 220, g: 120, b: 120, a: 255 }
    3724015615: 'MATE', //  0xFFDDF7F7 , { r: 221, g: 247, b: 247, a: 255 }
    3705436415: 'INGL', //0xFFDCDC78,  { r: 220, g: 220, b: 120, a: 255 }
    3466757887: 'LAT', //  0xFFCEA286 , { r: 206, g: 162, b: 134, a: 255 }
    3755330303: 'MOT', //int == 11011111 (r) 11010101 (g) 11001010 (b) (11111111, questo è il valore dell'a nell'rgba), 0xFF DFD5CA(FF) (SENZA FF, valore edll'alpha escluso dall'hex)in hex, { r: 223, g: 213, b: 202, a: 255 }
    3031741695: 'REL', // 0xFFB4B4B4, { r: 180, g: 180, b: 180, a: 255 }
    4158515967: 'FILO', //   0xFFF7DDEA, { r: 247, g: 221, b: 234, a: 255 }
    4158512639: 'STO/GEO', //   0xFFF7DDDD , { r: 247, g: 221, b: 221, a: 255 }
    3923099903: 'INFO', //  0xFFE9D5C0 ,  { r: 233, g: 213, b: 192, a: 255 }
    4076008191: 'INGL POT', //0xFFF2F2F2, { r: 242, g: 242, b: 242, a: 255 }
    2510995455: 'FIS', //   0xFF95AABF ,  { r: 149, g: 170, b: 191, a: 255 }
    4294967295: 'ITA' // 0xFFFFFFFF  , { r: 255, g: 255, b: 255, a: 255 }
}

var date_ob = new Date();
var anno_node = date_ob.getMonth() > 6 ? date_ob.getFullYear() : date_ob.getFullYear() - 1;
var anno_link = anno_node.toString() + '-' + (anno_node + 1).toString().slice(2);
var links = {};
var orariJson = {};

var url = `https://www.messedaglia.edu.it/images/stories/${anno_link}/orario/classi.html`


async function crop(image, ora, giorno, name) {


    try {
        // console.log('ora: ' + ora);
        // console.log('giorno: ' + giorno);
        let newImage = await Jimp.read(image)

        newImage = await newImage.crop(62 + 118 * ora, 75 + 78 * giorno, 115, 75) // FIXME: SCEGLIERE MEGLIO EDGES RETTANGOLO LEZIONE
            // newImage.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            //     fs.writeFileSync('test/' + `${62 + 118 * ora}-${75 + 78 * giorno} ` + name, buffer)
            // })
        return newImage;
    } catch (error) {
        throw ('ERRORE IN CROP(): ' + error)
    }

}



async function start() {

    const dir = fs.opendirSync('.')
    let dirent
    while ((dirent = dir.readSync()) !== null) {
        if (dirent.name.includes('png')) {
            console.log(dirent.name)
            let orari = [];
            let ita = 0;
            var image = await Jimp.read(dirent.name)

            image.resize(800, 600)
            let totaleGiorni = 6;
            let doesSabato = [];
            for (let sabato = 0; sabato < 5; sabato++) {
                let materia = image.getPixelColor(65 + 113 * 5, 78 + 78 * sabato)
                doesSabato.push(colors[materia])
            }
            if (doesSabato.every((val, i, arr) => val === arr[0])) totaleGiorni = 5;

            for (let giorno = 0; giorno < 6; giorno++) {
                // console.log(`ora numero: ${giorno}`);
                for (let ora = 0; ora < totaleGiorni; ora++) {

                    var rgb = image.getPixelColor(65 + 118 * ora, 78 + 78 * giorno);
                    //if(rgb==null) rgb = image.getPixelColor(65+118*ora, 78+78*giorno+15) 3E giorno=5 ora=2 scienze motorie && 1L giorno=5 ora=3 scienze motorie && 3F giorno=5 ora=0 scienze motorie && 1N giorno=5 ora=1 scienze motorie && 
                    if (colors[rgb] == null) rgb = image.getPixelColor(65 + 118 * ora, 78 + 78 * giorno + 20);
                    if (colors[rgb] == null) console.log('\n' + 'ALERT' + '\n');
                    if (colors[rgb] == 'ITA') ita++;
                    if (colors[rgb] == 'ITA' && ita >= 3) { //get array of pixels of rectangle
                        let imageCrop = await crop(image, ora, giorno, dirent.name)
                        let rgbArray = [];
                        for (let y = 0; y < imageCrop.bitmap.height; y++) {
                            for (let x = 0; x < imageCrop.bitmap.width; x++) {
                                let color = imageCrop.getPixelColor(x, y);
                                rgbArray.push(color)
                            }
                        }
                        if (rgbArray.every((val, i, arr) => val === arr[0])) orari.push('')
                        else orari.push('ITA')
                    } else orari.push(colors[rgb])
                        //console.log([colors[rgb], Jimp.intToRGBA(rgb)]);
                        // let croppedImage = image.crop(76 + 152 * giorno, 90 + 100 * ora - (ora != 0 ? 15 : 0), 152, 130 - (ora != 0 && ora != 5 ? 0 : 15))
                        // croppedImage.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                        //     fs.writeFileSync(__dirname + '/_giorno_' + giorno.toString() + '_ore_' + ora.toString() + '.png', buffer)


                }
                if (totaleGiorni == 5) orari.push('')
            }

            orariJson[dirent.name.split('.')[0]] = {}
            orariJson[dirent.name.split('.')[0]][`${dirent.name.split('.')[0]}url`] = 'TODO' // url[dirent.name.split('.')[0]];
            orariJson[dirent.name.split('.')[0]][`${dirent.name.split('.')[0]}`] = orari;

            //sleep(0.09 * 1000)





        }


    }
    dir.closeSync()
    console.log(orariJson);
}

start()