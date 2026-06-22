import type { SessionBlock, SessionDefinition } from '../content/types'
import type { SessionBlockLog, SessionBlockStatus } from './sessionBlocks'

export type LiveSessionStep = {
  block: SessionBlock
  index: number
  log: SessionBlockLog | null
  status: SessionBlockStatus
  total: number
}

export function isFinalLiveSessionStatus(status: SessionBlockStatus) {
  return status === 'done' || status === 'reduced' || status === 'changed' || status === 'skipped'
}

export function getOrderedLiveSessionBlocks(sessionDefinition: SessionDefinition) {
  return [...sessionDefinition.timeline].sort((a, b) => a.order - b.order)
}

function logByBlockKey(blockLogs: SessionBlockLog[]) {
  return new Map(blockLogs.map((log) => [log.blockKey, log]))
}

function buildStep(blocks: SessionBlock[], blockLogs: SessionBlockLog[], index: number): LiveSessionStep | null {
  const block = blocks[index]
  if (!block) {
    return null
  }

  const log = logByBlockKey(blockLogs).get(block.key) ?? null

  return {
    block,
    index,
    log,
    status: log?.status ?? 'planned',
    total: blocks.length,
  }
}

export function getDefaultLiveSessionStep(
  sessionDefinition: SessionDefinition,
  blockLogs: SessionBlockLog[],
): LiveSessionStep | null {
  const blocks = getOrderedLiveSessionBlocks(sessionDefinition)
  if (blocks.length === 0) {
    return null
  }

  const logs = logByBlockKey(blockLogs)
  const firstOpenIndex = blocks.findIndex((block) => !isFinalLiveSessionStatus(logs.get(block.key)?.status ?? 'planned'))
  return buildStep(blocks, blockLogs, firstOpenIndex === -1 ? blocks.length - 1 : firstOpenIndex)
}

export function getLiveSessionStep(
  sessionDefinition: SessionDefinition,
  blockLogs: SessionBlockLog[],
  blockKey: string | null,
): LiveSessionStep | null {
  const blocks = getOrderedLiveSessionBlocks(sessionDefinition)
  const index = blocks.findIndex((block) => block.key === blockKey)
  if (index === -1) {
    return getDefaultLiveSessionStep(sessionDefinition, blockLogs)
  }

  return buildStep(blocks, blockLogs, index)
}

export function getPreviousLiveSessionStep(
  sessionDefinition: SessionDefinition,
  blockLogs: SessionBlockLog[],
  blockKey: string,
): LiveSessionStep | null {
  const blocks = getOrderedLiveSessionBlocks(sessionDefinition)
  const index = blocks.findIndex((block) => block.key === blockKey)
  if (index === -1) {
    return null
  }

  return buildStep(blocks, blockLogs, Math.max(0, index - 1))
}

export function getNextLiveSessionStep(
  sessionDefinition: SessionDefinition,
  blockLogs: SessionBlockLog[],
  blockKey: string,
): LiveSessionStep | null {
  const blocks = getOrderedLiveSessionBlocks(sessionDefinition)
  const index = blocks.findIndex((block) => block.key === blockKey)
  if (index === -1) {
    return null
  }

  return buildStep(blocks, blockLogs, Math.min(blocks.length - 1, index + 1))
}
