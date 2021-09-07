/*
  GNU General Public License v3.0+ (see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt)
*/

/**
 * @class
 * @name MID0011
 * @param {object} MID0011_1 REV 1
 * @param {number} MID0011_1.parameterSetCount
 * @param {object} MID0011_1.parameterSetList
 * 
 * @param {object} MID0011_2 REV 2
 * @param {number} MID0011_2.parameterSetCount
 * @param {object} MID0011_2.parameterSetList
 * 
 * @param {object} MID0011_3 REV 3
 * @param {number} MID0011_3.parameterSetCount
 * @param {object} MID0011_3.parameterSetList
 * 
 * @param {object} MID0011_4 REV 4
 * @param {number} MID0011_4.parameterSetCount
 * @param {object} MID0011_4.parameterSetList
 */

const helpers = require("../helpers.js");
const processParser = helpers.processParser;
const serializerField = helpers.serializerField;

function parser(msg, opts, cb) {

    let buffer = msg.payload;
    msg.payload = {};

    let status = true

    let position = {
        value: 0
    };

    msg.revision = msg.revision || 1;
    msg.payload.parameterSetList = []

    status = status &&
    processParser(msg, buffer, "parameterSetCount", "number", 3, position, cb)

    if (msg.revision > 4) {
        cb(new Error(`[Parser MID${msg.mid}] invalid revision [${msg.revision}]`));
        return;
    }

    for(let i = 0; i < msg.payload.parameterSetCount; i++) {
        const pSetItem = { payload: { } }

        status = status && processParser(pSetItem, buffer, "pSetID", "number", 3, position, cb)

        //add number of cycles
        if (msg.revision > 1) {
            status = status && processParser(pSetItem, buffer, "cycleNo", "number", 2, position, cb)
        }

        //add type of program
        if (msg.revision > 2) {
            status = status && processParser(pSetItem, buffer, "programType", "string", 4, position, cb)
        }

        //add last change
        if (msg.revision > 3) {
            status = status && processParser(pSetItem, buffer, "lastChange", "string", 19, position, cb)
        }

        msg.payload.parameterSetList.push(pSetItem.payload)
    }

    if (status) {
        cb(null, msg)
    }
}

function serializer(msg, opts, cb) {
    let buf = Buffer.from("");
    msg.payload = buf;

    msg.revision = msg.revision || 1

    cb(null, msg);
}

function revision() {
    return [4,3,2,1];
}

module.exports = {
    parser,
    serializer,
    revision
};