// Coded by Salman
// buat atur database

/**
 * program database yang konsisten antara input dan output
 */

const { join } = require("path");
const { readFile, readFileSync, existsSync, writeFile, writeFileSync } = require("fs");

const print = console.log;
const printe = console.error;
const file = join(process.cwd(), "database", "users.json");

/**
 * @typedef {object} TanamUpdate
 * @property {string} autoai -> status autoai on/off
 * @property {string} [key] -> properti lain, harus berupa string
 */

/**
 * @class
 * class pengatur database user yang konsisten dan customable.
 * - Mengutamakan hasil pasti daripada kecepatan.
 * - Mengutamakan input dan output yang konsisten
 * - untuk proyek bot, class ini cukup memadai karena konsistensinya
 * - Tidak asbun dan jelas antara input-output
 * - sekian dan terimakasih
 */
class User {
  constructor() {
    this.siapinLahan();
    
  }

  siapinLahan = () => {
    print("[DATABASE LOG]: Inisiasi database user...");

    if (!existsSync(file)) {
      print(
        "[DATABASE LOG]: File database " +
          file +
          " tidak ditemukan. Otomatis membuat file..."
      );
      writeFile(file, "{}", "utf8");
    }
  };

  /**
   * panen -> mengambil data seluruh user
   * @returns {object} users -> list semua user beserta metadata
   */
  panen = () => {
    let isiKebun = []

    const data = readFileSync(file, "utf8")
    isiKebun.push(data)
   // print(data)

// await readFile(file, "utf8", (err, data) => {
//       try {
//         if (err) throw new Error(err);
//         isiKebun.push(data)
       
//         return isiKebun;
//       } catch (e) {
//         printe("[DATABASE LOG]: Error di method panen >> " + e.message);
        
//       }
//     });

 

    return JSON.parse(isiKebun[0]);
   
   
  };

  /**
   *
   * @param {string} id -> id user (format: 62xxxxx@s.whatsapp.net)
   * @returns {object} userinfo -> metadata mengenai user dengan id tersebut
   */
  pilih = id => {
    try {
      const list = this.panen();
      
      const userinfo = list[id];
      
      if (!userinfo) {
        print(
          "[DATABASE LOG]: User dengan id " +
            id +
            " tidak ditemukan di database"
        );
        return { failed: true };
      }

      return userinfo;
    } catch (e) {
      printe("[DATABASE LOG]: Error di method pilih >> " + e.message);
    }
  };

  /**
   * 
   * @param {object} input
   * @param {string} input.id -> id user (format 62xxxxx@s.whatsapp.net)
   * @param {{autoai: string, [key: string]: string}} input.update -> update terkait metadata user
   * @example
   * ```js
   * tanam({
   *      id :"621234567890@s.whatsapp.net",
   *      update: [{
   *      autoai: "on",
   *      status: "user",
   *      blocked: "false",
          //tambahin aja terserah yg penting string
   *    }]
   * })
   * ````
   */

  tanam = ({ id, update } = {}) => {
    let hasil = {}
    try {
      if (!id)
        throw new Error("User.tanam() error: parameter id belum diisi");
      if (!update)
        throw new Error("User.tanam() error: parameter update belum diisi");
    //  // if (!Array.isArray(update))
    //     throw new Error("User.tanam() error: tipe update harus berupa array");

      const userdata = this.panen();
    

      for (let key in update) {
        if (update[key] === undefined || update[key] === null) continue;
        hasil[key] = update[key];
      }

      userdata[id] = { id, ...hasil };

      writeFileSync(file, JSON.stringify(userdata, null, 2), "utf8");
    } catch (e) {
      printe("[DATABASE LOG]: Error di method tanam >> " + e.message);
    }
  };


  has = (id) => {
    const userdata = this.pilih(id);
    let hasil = userdata ? true : false
    return hasil;
  }


  reset = () => {
    const userdata = this.panen();
    const bakPath = join(process.cwd(), "database", "users.json.bak");
    writeFileSync(bakPath, JSON.stringify(userdata, null, 2), "utf8");
    writeFileSync(file, "{}", "utf8");
    print("[DATABASE LOG]: Database user berhasil direset. Backup tersimpan di " + bakPath);
  }


  restore = () => {
    const bakPath = join(process.cwd(), "database", "users.json.bak");
    if (!existsSync(bakPath)) {
      print("[DATABASE LOG]: File backup database tidak ditemukan. Tidak ada yang di-restore.");
      return;
    }
    const bakData = readFileSync(bakPath, "utf8");
    writeFileSync(file, bakData, "utf8");
    print("[DATABASE LOG]: Database user berhasil di-restore dari backup.");
  }


}

const userdb = new User();

module.exports = userdb;
