const express                       = require('express');
const app                           = express();
const aws                           = require('aws-sdk');
const bodyParser                    = require('body-parser')
const { body, validationResult }    = require('express-validator');

require('dotenv').config();
const mailFrom                        = process.env.MAIL_FROM;
const mailTo                          = process.env.MAIL_TO;
const mailTemplate                    = process.env.MAIL_TEMPLATE;

aws.config.loadFromPath(__dirname + '/config.json');

const ses = new aws.SES();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/send', [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('message').notEmpty()
], function (req, res) {
    // validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    // assembly email data
    var templateData        = {};
    templateData.name       = req.body.name;
    templateData.email      = req.body.email;
    templateData.message    = req.body.message;
    templateData.company    = req.body.company || '';
    templateData.telephone  = req.body.telephone || '';

    // send
    sendEmail(templateData, (err, data) => {
        if (err) {
            res.status(400);
            res.send('Error on email send. Please contact support.');
        } else {
            res.status(200).json({ message: "Email sent!"});
        }
    })
});

var sendEmail = function (templateData, callback) {
    var params = {};
    var destination = {
        "ToAddresses": [mailTo]
    };

    params.Source           = mailFrom;
    params.Destination      = destination;
    params.Template         = mailTemplate;
    params.TemplateData     = JSON.stringify(templateData);

    ses.sendTemplatedEmail(params, function (email_err, email_data) {
        if (email_err) {
            console.error("Failed to send email. error=" + email_err);
        } else {
            console.info("Successfully sent email. data=" + JSON.stringify(email_data));
        }
        callback(email_err, email_data);
    });
}

// start server
var server = app.listen(8082, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Geratek mail service listening at http://%s:%s', host, port);
});
