/*
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

const helpers = require("../helpers.js");
const processParser = helpers.processParser;
const processKey = helpers.processKey;

// keys are the same for revisions 1,2,3
const revKeys = [
    ["totalNoOfMessages", "number", 2],
    ["messageNumber", "number", 2],
    ["dataNoSystem", "number", 10],
    ["stationNo", "number", 2],
    ["time", "string", 19],
    ["boltNo", "number", 4],
    ["boltName", "string", 20],
    ["programName", "string", 20],
    ["pmStatus", "number", 1],
    ["errors", "string", 50],
    ["customErrorCode", "string", 4],
];

function parser(msg, opts, cb) {
    let buffer = msg.payload;
    msg.payload = {};

    let status = true;

    let revision = msg.revision || 1;

    switch (revision) {
        case 1:
        case 2:
        case 3:
            let position = {
                value: 0
            };

            const keys = revKeys;

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                status = status &&
                    processKey(msg, buffer, key[0], i + 1, 2, position, cb) &&
                    processParser(msg, buffer, key[0], key[1], key[2], position, cb);
            }

            if (!status) return; //we've already failed, return

            status = status &&
                processKey(msg, buffer, "numberOfBoltResults", 12, 2, position, cb) &&
                processParser(msg, buffer, "numberOfBoltResults", "number", 2, position, cb);

            // these parameters repeats for each numberOfBolts
            msg.payload.boltResults = [];

            for (let boltNr = 0; boltNr < msg.payload.numberOfBoltResults; boltNr++){
                // let's fake a message for the parsing, so we can get it's payload
                // and copy to the real message later
                let boltPart = { 
                    mid: msg.mid,
                    payload: { }
                }

                status = status &&
                    processParser(boltPart, buffer, "variableName", "string", 20, position, cb) &&
                    processParser(boltPart, buffer, "variableType", "string", 2, position, cb) &&
                    processParser(boltPart, buffer, "variableValue", "number", 7, position, cb);
                    

                if (!status) return; //we've already failed, return

                //copy from fake message to real one
                msg.payload.boltResults.push(boltPart.payload);
            }

            status = status &&
                processKey(msg, buffer, "numberOfStepResults", 13, 2, position, cb) &&
                processParser(msg, buffer, "numberOfStepResults", "number", 3, position, cb) &&
                processKey(msg, buffer, "allStepDataSent", 14, 2, position, cb) &&
                processParser(msg, buffer, "allStepDataSent", "number", 1, position, cb);
            

            msg.payload.stepResults = [];

            for (let stepNr = 0; stepNr < msg.payload.numberOfStepResults; stepNr++){

                let stepPart = { 
                    mid: msg.mid,
                    payload: { }
                }

                status = status &&
                    processParser(stepPart, buffer, "variableName", "string", 20, position, cb) &&
                    processParser(stepPart, buffer, "variableType", "string", 2, position, cb) &&
                    processParser(stepPart, buffer, "variableValue", "number", 7, position, cb) &&
                    processParser(stepPart, buffer, "stepNumber", "number", 2, position, cb);

                if (!status) return; //we've already failed, return

                //copy from fake message to real one
                msg.payload.stepResults.push(stepPart.payload);
            }

            // get count of special values
            status = status &&
                processKey(msg, buffer, "numberOfSpecialValues", 15, 2, position, cb) &&
                processParser(msg, buffer, "numberOfSpecialValues", "number", 2, position, cb);

            // special values
            msg.payload.specialValues = Array(msg.payload.numberOfSpecialValues);
            for (let i = 0; i < msg.payload.specialValues.length; i++) {
                const specialValueMsg = { payload: {} };
                status = status &&
                    processParser(specialValueMsg, buffer, "variableName", "string", 20, position, cb) &&
                    processParser(specialValueMsg, buffer, "variableType", "string", 2, position, cb) &&
                    processParser(specialValueMsg, buffer, "variableLength", "number", 2, position, cb);

                // Open Protocol spec doesn"t seem to specify what possible values for the type are, so using string just in case
                status = status &&
                    processParser(specialValueMsg, buffer, "variableValue", "string", specialValueMsg.payload.variableLength, position, cb);
                msg.payload.specialValues[i] = specialValueMsg.payload;
            }

            break;
        default:
            cb(new Error(`[Parser MID${msg.mid}] invalid revision [${msg.revision}]`));
            return;
    }

    if (status) {
        cb(null, msg);
    }
}

function serializer(msg, opts, cb) {
    let buf = Buffer.from("");
    msg.payload = buf;
    cb(null, msg);
}

function revision() {
    return [1, 2, 3];
}

module.exports = {
    parser,
    serializer,
    revision
};
