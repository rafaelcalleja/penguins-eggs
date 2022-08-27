/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import { exec } from '../../lib/utils'
import Utils from '../../classes/utils'
import shx from 'shelljs'
import fs from 'fs'
import yaml from 'js-yaml'

import { IPackages } from '../../interfaces/i-packages'
import { string } from '@oclif/core/lib/flags'

/**
 * 
 * @param this 
 */
export default async function packages(this: Sequence): Promise<void> {
    let echoYes = Utils.setEcho(true)
    const config_file = `${this.installTarget}/etc/calamares/modules/packages.conf`
    if (fs.existsSync(config_file)) {
        const packages = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IPackages

        let operations = JSON.parse(JSON.stringify(packages.operations))
        let packagesToRemove: string [] = []
        let packagesToInstall: string [] = []

        if (operations[0].remove.length === 0) {
            packagesToRemove = operations[0].remove
            packagesToInstall = operations[1].install 
        } else {
            packagesToInstall = operations[0].install 
        }

        if (packages.backend === 'apt') {
            for (const packageToRemove of packagesToRemove) {
                await exec(`chroot ${this.installTarget} apt-get purge -y ${packageToRemove} ${this.toNull}`, this.echo)
            }
            for (const packageToInstall of packagesToInstall) {
                await exec(`chroot ${this.installTarget} apt-get purge -y ${packageToInstall} ${this.toNull}`, this.echo)
            }
            await exec(`chroot ${this.installTarget} apt-get autoremove -y ${this.toNull}`, this.echo)

        } else if (packages.backend === 'pacman') {
            for (const packageToRemove of packagesToRemove) {
                await exec(`chroot ${this.installTarget} pacman -S ${packageToRemove}`, echoYes)
            }
            for (const packageToInstall of packagesToInstall) {
                await exec(`chroot ${this.installTarget} pacman -S ${packageToInstall}`, echoYes)
            }
        }
    }

}

