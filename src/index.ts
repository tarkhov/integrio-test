import crypto from 'crypto'
import { ReadStream } from 'fs'
import { FileHandle, open, readFile, writeFile } from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import express, {
  Application,
  Request,
  Response
} from 'express'
import cors from 'cors'
import jwt, { Secret } from 'jsonwebtoken'
import bcrypt from 'bcrypt'

dotenv.config()
const app: Application = express()

app.use(express.json())
app.use(cors())
app.use('/static', express.static(path.join(__dirname, '..', 'public')))

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

let headers: string[] = []
app.get('/movies', async (req: Request, res: Response) => {
  const year = req.query.year
  let page: number = Number(req.query.page ?? 0)
  const start: number = page * 63.5 * 1024
  const end: number = (++page) * 64 * 1024
  const fh: FileHandle = await open(path.join(__dirname, '..', 'assets', 'movies.tsv'))
  const stream: ReadStream = fh.createReadStream({ start, end, highWaterMark: 128 * 1024 })
  res.type('application/json')
  stream.on('data', (data: Buffer) => {
    const chunk: string = data.toString().trim()
    if (chunk) {
      let rows: any[] = chunk.split("\n")
      if (page === 1) {
        headers = rows.shift().split("\t")
      }

      rows = rows.map(line => {
        const row: string[] = line.split("\t")
        const item: any = {}
        if (row.length === headers.length) {
          headers.forEach((header, i) => {
            item[header] = row[i]
          })
        }
        return item
      })

      if (year) {
        rows = rows.filter(row => row.startYear == year)
      }

      res.write(JSON.stringify(rows))
    }
  })

  stream.on('end', () => {
    res.end()
  })
})

app.get('/generate-secret', (_, res: Response) => {
  const secret: string = crypto.randomBytes(64).toString('hex')
  res.send(secret)
})

async function fetchUsers(): Promise<object[]> {
  return new Promise(async (resolve, reject) => {
    let users: object[] = []
    try {
      const filePath: string = path.join(__dirname, '..', 'assets', 'users.json')
      const buffer: Buffer = await readFile(filePath)
      const data: string = buffer.toString().trim()
      if (data) {
        users = JSON.parse(data)
      }

      resolve(users)
    } catch (e: any) {
      reject(e)
    }
  })
}

function getUser(users: object[], username: string): object | undefined {
  return users.find((item: any) => item.username == username)
}

async function fetchUser(username: string): Promise<object> {
  return new Promise(async (resolve, reject) => {
    try {
      const users: object[] = await fetchUsers()

      const user = users.find((item: any) => item.username == username)
      if (!user) {
        return reject(new Error('User not found.'))
      }

      resolve(user)
    } catch (e: any) {
      reject(e)
    }
  })
}

function authenticate(res: Response, user: object): void {
  jwt.sign(user, <Secret>process.env.TOKEN_SECRET, (err: any, token: any) => {
    if (err) return res.status(403).send(err.message)
    res.set('Authorization', `Bearer ${token}`)
    return res.sendStatus(204)
  })
}

app.post('/register', async (req: Request, res: Response) => {
  const filePath: string = path.join(__dirname, '..', 'assets', 'users.json')
  const username: string = req.body.username
  let password: string = req.body.password
  let user: object | null | undefined = null
  let users: object[] = []

  try {
    users = await fetchUsers()
    if (users.length) {
      user = getUser(users, username)
      if (user) {
        return res.status(400).send('User already created.')
      }
    }
  } catch (e: any) {
    return res.status(400).send(e.message)
  }

  try {
    password = await bcrypt.hash(password, 10)
    user = { username, password }
    users.push(user)
  } catch (e: any) {
    return res.status(400).send(e.message)
  }

  try {
    await writeFile(filePath, JSON.stringify(users, null, 2))
  } catch (e: any) {
    return res.status(400).send(e.message)
  }

  authenticate(res, user)
})

app.post('/login', async (req: Request, res: Response) => {
  let user: any = null
  const username: string = req.body.username
  const password: string = req.body.password

  try {
    user = await fetchUser(username)
  } catch (e: any) {
    return res.status(403).send(e.message)
  }

  try {
    const compared: boolean = await bcrypt.compare(password, user.password)
    if (compared === false) return res.sendStatus(403)
    authenticate(res, user)
  } catch (e: any) {
    return res.status(400).send(e.message)
  }
})

const host: string = <string>process.env.HOST
const port: number = Number(process.env.PORT)
app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}.`)
})
