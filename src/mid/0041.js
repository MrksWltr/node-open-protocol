/*
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

/**
 * @class
 * @name MID0041
 * @param {object} MID0041_1 REV 1
 * @param {string} MID0041_1.toolSerialNo
 * @param {number} MID0041_1.toolNumberOfTightenings
 * @param {string} MID0041_1.lastCalibrationDate
 * @param {string} MID0041_1.controllerSerialNumber
 */

const { processKey } = require("../helpers.js");
const helpers = require("../helpers.js");
const processParser = helpers.processParser;
const serializerField = helpers.serializerField;

const revKeys = [
    ["toolSerialNo", "string", 14],
    ["toolNumberOfTightenings", "number", 10],
    ["lastCalibrationDate", "string", 19],
    ["controllerSerialNumber", "string", 10],
];

function parser(msg, opts, cb) {

    let buffer = msg.payload;
    msg.payload = {};

    let status = true

    let position = {
        value: 0
    };

    msg.revision = msg.revision || 1;

    switch (msg.revision) {
        case 1:
            const keys = revKeys

            for (let i = 0; i < keys.length; i++) {

                const key = keys[i];
                
                status = status &&
                    processKey(msg, buffer, key[0], i + 1, 2, position, cb) &&
                    processParser(msg, buffer, key[0], key[1], key[2], position, cb);
            }
            
            if (!status) return;
            
            break;

        default:
            cb(new Error(`[Parser MID${msg.mid}] invalid revision [${msg.revision}]`));
            break;
    }

    cb(null, msg)
}

function serializer(msg, opts, cb) {
    let buf = Buffer.from("");
    msg.payload = buf;
    cb(null, msg);
}

function revision() {
    return [1];
}

module.exports = {
    parser,
    serializer,
    revision
};