const config = require('config');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const iconv = require('iconv-lite');
const { Parser } = require('json2csv');
const fs = require('fs').promises;
const path = require('path');

const testData = [
    {
        col0: 'абвгдеёж',
        col1: 'зийклмнопрст',
        col2: 'уфхцчшщъыьэюя',
    },
];

const saveCsv = async (data, fileName) => {
    let fields = [
        {
            label: 'col0',
            value: 'col0',
        },
        {
            label: 'col1',
            value: 'col1',
        },
        {
            label: 'col2',
            value: 'col2',
        },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    const buffer = iconv.encode(csv, 'win1251');

    await fs.writeFile(fileName, buffer);
    return path.resolve(fileName);
};

const sendEmail = async (to, subject, text, attachmentName, attachmentPath) => {
    const mailgun = new Mailgun(formData);

    const mg = mailgun.client({
        username: 'api',
        key: config.get('mailgun.key'),
        public_key: config.get('mailgun.public_key'),
    });

    const messageParams = {
        from: config.get('mailgun.from'),
        to: [to],
        subject,
        text,
    };

    const attachmentData = await fs.readFile(attachmentPath);

    messageParams.attachment = {
        filename: attachmentName,
        data: attachmentData,
    };

    const msg = await mg.messages.create(config.get('mailgun.domain'), messageParams);
    return msg;
};

(async () => {
    const attachmentName = 'test.csv';
    const attachmentPath = await saveCsv(testData, attachmentName);
    const msg = await sendEmail(
        config.get('mailgun.to'),
        'mailgun encoding test',
        'csv attachment in windows-1251 encoding',
        attachmentName,
        attachmentPath);
    console.log(msg);
})();
