import { promises as fs } from 'fs'
import * as path from 'path'
import { combineLatest, from, Observable } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { Config } from '../config'
import { Cache } from '../data'
import { makeArtifactsDir } from '../utils'

export const fetchDataAndCache = ({
  config,
  cachePath,
  watch,
}: {
  config: Config
  cachePath?: string
  watch: boolean
}): Observable<void> => {
  const writeCacheToFile_ = writeCacheToFile()

  return combineLatest([
    from(prepareCacheFilePath(cachePath)),
    config.source.fetchData({ watch, force: false, previousCache: undefined }),
  ]).pipe(mergeMap(([cacheFilePath, cache]) => writeCacheToFile_({ cacheFilePath, cache })))
}

const prepareCacheFilePath = async (cachePath?: string): Promise<string> => {
  if (cachePath) {
    return path.join(cachePath, 'cache.json')
  } else {
    const artifactsDirPath = await makeArtifactsDir()
    return path.join(artifactsDirPath, 'cache.json')
  }
}

const writeCacheToFile = () => {
  let lastUpdateInMs: number | undefined
  return async ({ cache, cacheFilePath }: { cacheFilePath: string; cache: Cache }) => {
    if (cache.lastUpdateInMs !== lastUpdateInMs) {
      await fs.writeFile(cacheFilePath, JSON.stringify(cache, null, 2))
      // console.log(`Data cache file successfully written to ${cacheFilePath}`)
      lastUpdateInMs = cache.lastUpdateInMs
    }
  }
}