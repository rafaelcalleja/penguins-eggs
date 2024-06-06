/**
 * ./src/classes/tools.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import os from 'node:os'

import Settings from './settings.js'
import Utils from './utils.js'

interface IEggsConfigTools {
  filterDeb: string
  localPathDeb: string
  localPathDoc: string
  localPathIso: string
  remoteHost: string
  remotePathDeb: string
  remotePathDoc: string
  remotePathIso: string
  remoteUser: string
}

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Tools {
  config = {} as IEggsConfigTools

  snapshot_dir = ''

  snapshot_name = ''

  tools_yaml = '/etc/penguins-eggs.d/tools.yaml'

  /*
   * Load configuration from /etc/penguins-eggs.yaml
   * @returns {boolean} Success
   */
  async loadSettings(): Promise<boolean> {
    let foundSettings = false

    if (fs.existsSync(this.tools_yaml)) {
      foundSettings = true
      const loaded = yaml.load(fs.readFileSync(this.tools_yaml, 'utf8')) as IEggsConfigTools
      this.config.remoteHost = loaded.remoteHost
      this.config.remoteUser = loaded.remoteUser
      this.config.remotePathDeb = loaded.remotePathDeb
      this.config.remotePathDoc = loaded.remotePathDoc
      this.config.remotePathIso = loaded.remotePathIso

      this.config.localPathDeb = loaded.localPathDeb
      this.config.localPathDoc = loaded.localPathDoc
      this.config.localPathIso = loaded.localPathIso

      this.config.filterDeb = loaded.filterDeb

      /**
       * da eggs
       */
      const settings = new Settings()
      settings.load()
      this.snapshot_dir = settings.config.snapshot_dir

      const prefix = settings.config.snapshot_prefix
      this.snapshot_name = prefix + settings.config.snapshot_basename + '_' + Utils.uefiArch()
    } else {
      console.log(`Can't find: ${this.tools_yaml}`)
      process.exit(1)
    }

    return foundSettings
  }
}
