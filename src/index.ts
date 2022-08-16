import crypto from 'crypto'
import { ReadStream } from 'fs'
import { FileHandle, open } from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import express, {
  Application,
  Request,
  Response
} from 'express'
import cors from 'cors'

dotenv.config()
const app: Application = express()

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
  stream.on('data', data => {
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

app.get('/generate-secret', (req: Request, res: Response) => {
  const secret: string = crypto.randomBytes(64).toString('hex')
  res.send(secret)
})

const host: string = String(process.env.HOST)
const port: number = Number(process.env.PORT)
app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}.`)
})
