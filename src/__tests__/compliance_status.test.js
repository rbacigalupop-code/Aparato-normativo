// ─────────────────────────────────────────────────────────────────────────────
// compliance_status.test.js — motor de estados (lib/compliance/status.js)
//
// PROMPT 1: la ausencia de un dato obligatorio JAMÁS puede equivaler a CUMPLE.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  ESTADO, estadoDeCheck, esBloqueador, contarEstados, consolidar,
} from '../lib/compliance/status.js'

describe('estadoDeCheck — mapeo de un check a estado', () => {
  it('con dato y ok=true → CUMPLE', () => {
    expect(estadoDeCheck({ val: '0.30', ok: true, obligatorio: true })).toBe(ESTADO.CUMPLE)
  })
  it('con dato y ok=false → NO_CUMPLE', () => {
    expect(estadoDeCheck({ val: '0.50', ok: false, obligatorio: true })).toBe(ESTADO.NO_CUMPLE)
  })
  it('sin dato + obligatorio → NO_VERIFICADO (nunca CUMPLE)', () => {
    expect(estadoDeCheck({ val: null, ok: true, obligatorio: true })).toBe(ESTADO.NO_VERIFICADO)
    // aunque ok venga true por el patrón viejo `!valor || ...`, sin dato NO es CUMPLE
    expect(estadoDeCheck({ val: '', ok: true, obligatorio: true })).toBe(ESTADO.NO_VERIFICADO)
  })
  it('sin dato + opcional → NO_APLICA', () => {
    expect(estadoDeCheck({ val: null, ok: true, obligatorio: false })).toBe(ESTADO.NO_APLICA)
    expect(estadoDeCheck({ val: null, ok: true })).toBe(ESTADO.NO_APLICA)
  })
  it('informativo → INFORMATIVO aunque ok=false', () => {
    expect(estadoDeCheck({ val: '~40 dB', ok: false, informativo: true })).toBe(ESTADO.INFORMATIVO)
  })
  it('noAplica → NO_APLICA', () => {
    expect(estadoDeCheck({ val: 'No exigible', ok: true, noAplica: true })).toBe(ESTADO.NO_APLICA)
  })
  it('noAplica + informativo (p.ej. RF Escaleras no exigible) → NO_APLICA (noAplica manda)', () => {
    expect(estadoDeCheck({ val: 'No exigible', ok: true, noAplica: true, informativo: true })).toBe(ESTADO.NO_APLICA)
  })
  it('respeta un estado explícito válido', () => {
    expect(estadoDeCheck({ estado: ESTADO.NO_VERIFICADO, val: '0.3', ok: true })).toBe(ESTADO.NO_VERIFICADO)
  })
  it('ignora un estado explícito inválido y usa las banderas', () => {
    expect(estadoDeCheck({ estado: 'RIESGO', val: 'Sin condensación', ok: true })).toBe(ESTADO.CUMPLE)
  })
})

describe('esBloqueador — qué impide el CUMPLE global', () => {
  it('NO_CUMPLE bloquea', () => {
    expect(esBloqueador({ val: '0.5', ok: false, obligatorio: true })).toBe(true)
  })
  it('NO_VERIFICADO obligatorio bloquea', () => {
    expect(esBloqueador({ val: null, obligatorio: true })).toBe(true)
  })
  it('NO_VERIFICADO no-obligatorio NO bloquea (queda como NO_APLICA)', () => {
    expect(esBloqueador({ val: null, obligatorio: false })).toBe(false)
  })
  it('INFORMATIVO no bloquea', () => {
    expect(esBloqueador({ val: '~40', ok: false, informativo: true })).toBe(false)
  })
  it('CUMPLE no bloquea', () => {
    expect(esBloqueador({ val: '0.3', ok: true, obligatorio: true })).toBe(false)
  })
})

describe('consolidar — estado global del proyecto', () => {
  it('obligatorio NO_CUMPLE → global NO_CUMPLE', () => {
    const checks = [
      { label: 'Muro U', val: '0.30', ok: true, obligatorio: true },
      { label: 'Techo U', val: '0.50', ok: false, obligatorio: true },
    ]
    expect(consolidar(checks).estado).toBe(ESTADO.NO_CUMPLE)
  })

  it('obligatorio NO_VERIFICADO sin NO_CUMPLE → global NO_VERIFICADO', () => {
    const checks = [
      { label: 'Muro U', val: '0.30', ok: true, obligatorio: true },
      { label: 'Techo U', val: null, obligatorio: true }, // sin dato
    ]
    expect(consolidar(checks).estado).toBe(ESTADO.NO_VERIFICADO)
  })

  it('todos los obligatorios CUMPLE + NO_APLICA → global CUMPLE', () => {
    const checks = [
      { label: 'Muro U', val: '0.30', ok: true, obligatorio: true },
      { label: 'Techo U', val: '0.20', ok: true, obligatorio: true },
      { label: 'Puerta U', val: null, obligatorio: false }, // NO_APLICA
      { label: 'Rw fachada (PDA)', val: '~40', ok: false, informativo: true }, // INFORMATIVO
    ]
    expect(consolidar(checks).estado).toBe(ESTADO.CUMPLE)
  })

  it('NO_CUMPLE tiene precedencia sobre NO_VERIFICADO', () => {
    const checks = [
      { label: 'Muro U', val: '0.50', ok: false, obligatorio: true }, // NO_CUMPLE
      { label: 'Techo U', val: null, obligatorio: true },             // NO_VERIFICADO
    ]
    expect(consolidar(checks).estado).toBe(ESTADO.NO_CUMPLE)
  })

  it('CASO LIUCURA: cubierta aplicable NO_CUMPLE ⇒ nunca CUMPLE', () => {
    const checks = [
      { label: 'Muro U',  val: '0.3853', ok: true,  obligatorio: true },
      { label: 'Techo U', val: '0.2960', ok: false, obligatorio: true }, // 0.296 > 0.28
      { label: 'Piso U',  val: '0.3300', ok: true,  obligatorio: true },
    ]
    expect(consolidar(checks).estado).toBe(ESTADO.NO_CUMPLE)
  })

  it('proyecto incompleto (obligatorios sin dato) NO es CUMPLE', () => {
    const checks = [
      { label: 'Muro U',  val: null, obligatorio: true },
      { label: 'Techo U', val: null, obligatorio: true },
      { label: 'Piso U',  val: null, obligatorio: true },
    ]
    expect(consolidar(checks).estado).toBe(ESTADO.NO_VERIFICADO)
  })

  it('expone contadores y bloqueadores', () => {
    const checks = [
      { label: 'Muro U', val: '0.30', ok: true, obligatorio: true },
      { label: 'Techo U', val: '0.50', ok: false, obligatorio: true },
      { label: 'Piso U', val: null, obligatorio: true },
      { label: 'Rw', val: '~40', ok: false, informativo: true },
    ]
    const r = consolidar(checks)
    expect(r.contadores).toEqual({ CUMPLE: 1, NO_CUMPLE: 1, NO_VERIFICADO: 1, NO_APLICA: 0, INFORMATIVO: 1 })
    expect(r.bloqueadores.map(c => c.label)).toEqual(['Techo U', 'Piso U'])
  })
})

describe('contarEstados', () => {
  it('cuenta cada estado', () => {
    const checks = [
      { val: '0.3', ok: true, obligatorio: true },   // CUMPLE
      { val: '0.5', ok: false, obligatorio: true },  // NO_CUMPLE
      { val: null, obligatorio: true },              // NO_VERIFICADO
      { val: null, obligatorio: false },             // NO_APLICA
      { val: '~40', ok: false, informativo: true },  // INFORMATIVO
    ]
    expect(contarEstados(checks)).toEqual({ CUMPLE: 1, NO_CUMPLE: 1, NO_VERIFICADO: 1, NO_APLICA: 1, INFORMATIVO: 1 })
  })
})
