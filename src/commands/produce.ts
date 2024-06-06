/**
 * ./src/commands/produce.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import fs, { link } from 'node:fs'
import path from 'node:path'

import Compressors from '../classes/compressors.js'
import Ovary from '../classes/ovary.js'
import Utils from '../classes/utils.js'
import { IAddons, IExcludes } from '../interfaces/index.js'
import Config from './config.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default class Produce extends Command {
  static description = 'produce a live image from your system whithout your data'

  static examples = [
    'sudo eggs produce',
    'sudo eggs produce --standard',
    'sudo eggs produce --max',
    'sudo eggs produce --max --basename=colibri',
    'sudo eggs produce --cryptedclone 4G',
    'sudo eggs produce --clone',
    'sudo eggs produce --basename=colibri',
    'sudo eggs produce --basename=colibri --theme theme --addons adapt',
    'sudo eggs produce --excludes=usr var',
    'sudo eggs produce --excludes=static'
  ]

  static flags = {
    addons: Flags.string({ description: 'addons to be used: adapt, ichoice, pve, rsupport', multiple: true }),
    basename: Flags.string({ description: 'basename' }),
    clone: Flags.boolean({ char: 'c', description: 'clone' }),
    cryptedclone: Flags.boolean({ char: 'C', description: 'crypted clone' }),
    excludes: Flags.string({ description: 'use: custom, home, mine, usr, var', multiple: true }),
    help: Flags.help({ char: 'h' }),
    links: Flags.string({ description: 'desktop links', multiple: true }),
    max: Flags.boolean({ char: 'm', description: 'max compression' }),
    noicons: Flags.boolean({ char: 'N', description: 'no icons on desktop' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    prefix: Flags.string({ char: 'p', description: 'prefix' }),
    release: Flags.boolean({ description: 'release: max compression, remove penguins-eggs and calamares after installation' }),
    script: Flags.boolean({ char: 's', description: 'script mode. Generate scripts to manage iso build' }),
    standard: Flags.boolean({ char: 'f', description: 'standard compression' }),
    theme: Flags.string({ description: 'theme for livecd, calamares branding and partitions' }),
    unsecure: Flags.boolean({ char: 'u', description: '/root contents are included on live' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
    yolk: Flags.boolean({ char: 'y', description: 'force yolk renew' })
  }

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Produce)
    if (Utils.isRoot()) {
      /**
       * ADDONS dei vendors
       * Fino a 3
       */
      const addons = []
      if (flags.addons) {
        const { addons } = flags // array
        for (let addon of addons) {
          // se non viene specificato il vendor il default è eggs
          if (!addon.includes('//')) {
            addon = 'eggs/' + addon
          }

          const dirAddon = path.resolve(__dirname, `../../addons/${addon}`)
          if (!fs.existsSync(dirAddon)) {
            console.log(dirAddon)
            Utils.warning('addon: ' + chalk.white(addon) + ' not found, terminate!')
            process.exit()
          }

          const vendorAddon = addon.slice(0, Math.max(0, addon.search('/')))
          const nameAddon = addon.substring(addon.search('/') + 1, addon.length)
          if (nameAddon === 'theme') {
            flags.theme = vendorAddon
          }
        }
      }

      // links check
      const myLinks: string[] = []
      if (flags.links) {
        const { links } = flags
        for (const link_ of links) {
          if (fs.existsSync(`/usr/share/applications/${link_}.desktop`)) {
            myLinks.push(link_)
          } else {
            Utils.warning('desktop link: ' + chalk.white('/usr/share/applications/' + link_ + '.desktop') + ' not found!')
          }
        }
      }

      /**
       * composizione dei flag
       */

      // excludes
      const excludes = {} as IExcludes
      excludes.static = false
      excludes.home = false
      excludes.mine = false
      excludes.usr = false
      excludes.var = false

      if (flags.excludes) {
        if (flags.excludes.includes('static')) {
          excludes.static = true
        }

        if (flags.excludes.includes('home')) {
          excludes.home = true
        }

        if (flags.excludes.includes('mine')) {
          excludes.mine = true
        }

        if (flags.excludes.includes('usr')) {
          excludes.usr = true
        }

        if (flags.excludes.includes('var')) {
          excludes.var = true
        }
      }

      let prefix = ''
      if (flags.prefix !== undefined) {
        prefix = flags.prefix
      }

      let basename = '' // se vuoto viene definito da loadsetting (default nome dell'host)
      if (flags.basename !== undefined) {
        basename = flags.basename
      }

      const compressors = new Compressors()
      await compressors.populate()

      let compression = compressors.fast()
      if (flags.max) {
        compression = compressors.max()
      } else if (flags.standard) {
        compression = compressors.standard()
      }

      const { release } = flags

      const { cryptedclone } = flags

      const { clone } = flags

      const { verbose } = flags

      const scriptOnly = flags.script

      const yolkRenew = flags.yolk

      const { nointeractive } = flags

      const { noicons } = flags

      // if clone or cryptedclone unsecure = true
      const unsecure = flags.unsecure || clone || cryptedclone

      /**
       * theme: if not defined will use eggs
       */
      let theme = 'eggs'
      if (flags.theme !== undefined) {
        theme = flags.theme
        if (theme.includes('/')) {
          if (theme.endsWith('/')) {
            theme = theme.slice(0, Math.max(0, theme.length - 1))
          }
        } else {
          const wpath = `/home/${await Utils.getPrimaryUser()}/.wardrobe/vendors/`
          theme = wpath + flags.theme
        }

        theme = path.resolve(theme)
        if (!fs.existsSync(theme + '/theme')) {
          console.log('Cannot find theme: ' + theme)
          process.exit()
        }
      }

      const i = await Config.thatWeNeed(nointeractive, noicons, verbose, cryptedclone)
      if ((i.needApt || i.configurationInstall || i.configurationRefresh || i.distroTemplate) && (await Utils.customConfirm('Select yes to continue...'))) {
        await Config.install(i, nointeractive, noicons, verbose)
      }

      const myAddons = {} as IAddons
      if (flags.addons != undefined) {
        if (flags.addons.includes('adapt')) {
          myAddons.adapt = true
        }

        if (flags.addons.includes('ichoice')) {
          myAddons.ichoice = true
        }

        if (flags.addons.includes('pve')) {
          myAddons.pve = true
        }

        if (flags.addons.includes('rsupport')) {
          myAddons.rsupport = true
        }
      }

      Utils.titles(this.id + ' ' + this.argv)
      const ovary = new Ovary()
      Utils.warning('Produce an egg...')
      if (await ovary.fertilization(prefix, basename, theme, compression, !nointeractive)) {
        await ovary.produce(clone, cryptedclone, scriptOnly, yolkRenew, release, myAddons, myLinks, excludes, nointeractive, noicons, unsecure, verbose)
        ovary.finished(scriptOnly)
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}

const validSizePattern = /^(\d+)([GM]?)$/

function isValidSize(input: string): boolean {
  return validSizePattern.test(input)
}
