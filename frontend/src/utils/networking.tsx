'use strict'

const site = 'http://localhost:8080'
const wssite = site.replace('http', 'ws')

export function getSite(_: string): string {
  return site
}

export function getWSSite(_: string): string {
  return wssite
}

