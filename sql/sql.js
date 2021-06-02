const { dev } = require("../config.json");
const v = dev ? "dev_" : "live_"

class MySQL {
    /**
     * Creates a MySQL connection
     * @param {Object} login Login object in format:
     * { host, user, password, database }
     */
    constructor(login) {
        const config = login;
        config.charset = 'UTF8MB4_GENERAL_CI';
        this.con = require("mysql").createConnection(config);

        this.con.connect(err => {
            if (err) throw err;
            console.log(`Established connection to MySQL server at ${login.host}`);
            this.con.query(`SELECT COUNT(*) FROM \`${v}guilds\``, (error, result) => {
                console.log(`Number of guilds in database: ${result[0]["COUNT(*)"]}.`);
            });
        });

        this.escape = this.con.escape.bind(this.con);
    }
    /**
     * Get rows from table.
     * If this doesnt work in the future, it might be because queryLogic isn't escaped.
     * @param {String} table Table name
     * @param {String} queryLogic Selector logic, e.g. "id = 12345678"
     * @returns {Promise<RowDataPacket>} Array of objects (found rows)
     */
    get(table, queryLogic) {
        return new Promise((res) => {
            const query = `SELECT * FROM \`${v+table}\`${queryLogic ? ` WHERE ( ${queryLogic} )` : ``}`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                res(result);
            });
        });
    }
    /**
     * Insert data into a table as a new row(s).
     * @param {String} table Table name
     * @param {Object|Array<object>} object Inserted data where `key = collumn` and `value = value`. If an array is passed every object must contain the same keys
     * @returns {Promise<OkPacket>} OkPacket, object with status information
     */
    insert(table, object) {
        return new Promise((res) => {
            const query = `INSERT INTO \`${v+table}\` (\`${Array.isArray(object) ? Object.keys(object[0]).join("`, `") : Object.keys(object).join("`, `")}\`) VALUES (${Array.isArray(object) ? object.map(element => Object.values(element).map(val => this.escape(val)).join(", ")).join("), (") : Object.values(object).map(obj => this.escape(obj)).join(", ")})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                console.log(`Inserted ${result.affectedRows} rows.`);
                res(result);
            });
        });
    }
    /**
     * Update existing data in a table by row.
     * @param {String} table Table name
     * @param {String} queryLogic Selector logic, e.g. "id = 12345678"
     * @param {Object} object Updated data where `key = collumn` and `value = value`
     * @returns {Promise<OkPacket>} OkPacket, object with status information
     */
    update(table, queryLogic, object) {
        return new Promise((res) => {
            const query = `UPDATE \`${v+table}\` SET ${Object.keys(object).map((key) => `\`${key}\` = ${this.escape(object[key])}`).join(", ")} WHERE (${queryLogic})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                console.log(`Updated ${result.affectedRows} rows`);
                res(result);
            });
        });
    }
    /**
     * Delete a row/rows from a table
     * @param {String} table Table name
     * @param {String} queryLogic Selector logic, e.g. "id = 12345678"
     * @returns {Promise<OkPacket>} OkPacket, object with status information
     */
    delete(table, queryLogic) {
        return new Promise((res) => {
            const query = `DELETE FROM ${v+table} WHERE (${queryLogic})`;
            this.con.query(query, (err, result) => {
                if (err) throw err;
                console.log(`Removed ${result.affectedRows} rows`);
                res(result);
            })
        });
    }
}

module.exports = MySQL;