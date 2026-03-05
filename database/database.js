const sqlite3=require('sqlite3').verbose()

const db=new sqlite3.Database('./database/leads.db')

db.serialize(()=>{

db.run(
CREATE TABLE IF NOT EXISTS leads (
id INTEGER PRIMARY KEY,
company TEXT,
phone TEXT,
website TEXT,
rating TEXT,
reviews TEXT,
address TEXT,
city TEXT,
state TEXT,
email TEXT,
score INTEGER
)
)

})

module.exports=db
