import path from 'path'
import poi from '../lib'

const oldCwd = process.cwd()

beforeAll(() => {
  process.chdir('./test/fixture')
})

afterAll(() => {
  process.chdir(oldCwd)
})

describe('get webpack config', () => {
  describe('entry', () => {
    it('use default entry', () => {
      const config = poi().webpackConfig

      expect(config.entry('client').values())
        .toEqual([path.resolve('index.js')])

      expect(config.entryPoints.has('polyfills')).toBe(false)
    })

    it('use custom entry', () => {
      const entries = [
        'other-entry.js',
        ['other-entry.js', 'index.js'],
        { index: 'entry.js' },
        { foo: ['foo.js', 'bar.js'] }
      ]

      const [a, b, c, d] = entries.map(entry => poi({ entry }).webpackConfig)

      expect(a.entry('client').values())
        .toEqual([path.resolve(entries[0])])

      expect(b.entry('client').values())
        .toEqual(entries[1].map(v => path.resolve(v)))

      expect(c.entry('index').values())
        .toEqual([path.resolve('entry.js')])

      expect(d.entry('foo').values())
        .toEqual(['foo.js', 'bar.js'].map(v => path.resolve(v)))
    })

    it('add hmr entry', () => {
      const config = poi({
        entry: 'index.js',
        mode: 'development'
      }).webpackConfig

      expect(config.entry('client').values())
        .toEqual([
          path.join(__dirname, '../app/dev-client.es6'),
          path.resolve('index.js')
        ])
    })

    it('add hmr entry using keyword', () => {
      const config = poi({
        entry: {
          foo: [':hot:', 'foo.js'],
          bar: ['[hot]', 'bar.js']
        },
        mode: 'development'
      }).webpackConfig

      expect(config.entry('foo').values())
        .toEqual([
          path.join(__dirname, '../app/dev-client.es6'),
          path.resolve('foo.js')
        ])

      expect(config.entry('bar').values())
        .toEqual([
          path.join(__dirname, '../app/dev-client.es6'),
          path.resolve('bar.js')
        ])
    })
  })

  describe('output dir', () => {
    it('default dir', () => {
      const config = poi().getWebpackConfig()

      expect(config.output.path).toBe(path.resolve('dist'))
    })

    it('custom dir', () => {
      const config = poi({ dist: 'foo/bar' }).getWebpackConfig()

      expect(config.output.path).toBe(path.resolve('foo/bar'))
    })
  })

  describe('copy static files', () => {
    it('copy existing static folder', () => {
      const config = poi().webpackConfig

      expect(config.plugins.has('copy-static-files')).toBe(true)
      expect(config.plugins.get('copy-static-files').get('args')[0].length)
        .toBe(1)
    })

    it('accepts object', () => {
      const config = poi({
        copy: {}
      }).webpackConfig

      expect(config.plugins.get('copy-static-files').get('args')[0].length)
        .toBe(2)
    })

    it('accepts array', () => {
      const config = poi({
        copy: [{}, {}]
      }).webpackConfig

      expect(config.plugins.get('copy-static-files').get('args')[0].length)
        .toBe(3)
    })

    it('could be disabled', () => {
      const config = poi({
        copy: false
      }).webpackConfig

      expect(config.plugins.has('copy-static-files'))
        .toBe(false)
    })
  })

  describe('use preset', () => {
    it('in all modes', () => {
      const preset = poi => {
        poi.extendWebpack(config => {
          config.entry('foo')
            .add(path.resolve(poi.options.cwd, 'haha.js'))
        })
      }
      const config = poi({
        cwd: 'foo',
        presets: preset
      }).webpackConfig

      expect(config.entry('foo').values()).toEqual([path.resolve('foo', 'haha.js')])
    })

    it('in dev command', () => {
      const presets = [
        poi => {
          poi.extendWebpack('development', config => {
            config.entry('foo').add('foo')
          })
        },
        poi => {
          poi.extendWebpack('development', config => {
            config.entry('foo').add('bar')
          })
        }
      ]

      const config = poi({
        mode: 'development',
        presets
      }).webpackConfig

      expect(config.entry('foo').values()).toEqual(['foo', 'bar'])
    })
  })
})
