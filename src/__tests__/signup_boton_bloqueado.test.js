// ─────────────────────────────────────────────────────────────────────────────
// signup_boton_bloqueado.test.js — regresión del deadlock del botón "Crear cuenta"
//
// BUG (Ley 21.719, commit 2b5d9ca): el checkbox de consentimiento limpiaba su
// error con `setFieldErrors(prev => ({ ...prev, politica: undefined }))`, dejando
// la CLAVE 'politica' en el objeto con valor undefined. El botón se deshabilitaba
// con `Object.keys(fieldErrors).length > 0`, que cuenta esa clave fantasma → el
// botón quedaba bloqueado para SIEMPRE apenas el usuario marcaba la casilla
// (obligatoria). Nadie podía registrarse.
//
// FIX: la guarda usa hayErrores() = Object.values(...).some(Boolean), que ignora
// las claves con valor falsy; y el handler del checkbox ahora BORRA la clave.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import { hayErrores } from '../utils/errors'
import { botonAuthDeshabilitado } from '../utils/authForm'

describe('Botón "Crear cuenta" — no debe bloquearse por claves fantasma', () => {
  it('objeto vacío → sin errores (botón habilitado)', () => {
    expect(hayErrores({})).toBe(false)
  })

  it('CASO DEL BUG: {politica: undefined} → sin errores activos (botón habilitado)', () => {
    // Antes, Object.keys({politica: undefined}).length > 0 === true bloqueaba el botón.
    expect(Object.keys({ politica: undefined }).length > 0).toBe(true) // comportamiento viejo (malo)
    expect(hayErrores({ politica: undefined })).toBe(false)            // comportamiento nuevo (correcto)
  })

  it('todas las claves limpiadas a undefined → sin errores activos', () => {
    expect(hayErrores({ email: undefined, password: undefined, politica: undefined })).toBe(false)
  })

  it('un error real con mensaje → sí bloquea', () => {
    expect(hayErrores({ email: 'Email inválido' })).toBe(true)
  })

  it('mezcla de error real + claves fantasma → bloquea por el error real', () => {
    expect(hayErrores({ politica: undefined, password: 'Al menos 1 número' })).toBe(true)
  })

  it('null/undefined como objeto → sin errores (no revienta)', () => {
    expect(hayErrores(null)).toBe(false)
    expect(hayErrores(undefined)).toBe(false)
  })
})

describe('botonAuthDeshabilitado — gating del botón de enviar (login/signup)', () => {
  it('login, sin errores, casilla sin marcar → HABILITADO (login no exige casilla)', () => {
    expect(botonAuthDeshabilitado({ modo: 'login', fieldErrors: {}, aceptaPolitica: false })).toBe(false)
  })

  it('login, procesando → deshabilitado', () => {
    expect(botonAuthDeshabilitado({ modo: 'login', procesando: true })).toBe(true)
  })

  it('signup, casilla SIN marcar, sin errores → DESHABILITADO (exigir consentimiento)', () => {
    expect(botonAuthDeshabilitado({ modo: 'signup', fieldErrors: {}, aceptaPolitica: false })).toBe(true)
  })

  it('signup, casilla marcada, sin errores → HABILITADO', () => {
    expect(botonAuthDeshabilitado({ modo: 'signup', fieldErrors: {}, aceptaPolitica: true })).toBe(false)
  })

  it('signup, casilla marcada, con clave fantasma {politica: undefined} → HABILITADO (no bloquea)', () => {
    expect(botonAuthDeshabilitado({ modo: 'signup', fieldErrors: { politica: undefined }, aceptaPolitica: true })).toBe(false)
  })

  it('signup, casilla marcada, con error de campo real → deshabilitado', () => {
    expect(botonAuthDeshabilitado({ modo: 'signup', fieldErrors: { email: 'Email inválido' }, aceptaPolitica: true })).toBe(true)
  })

  it('signup, casilla marcada, procesando → deshabilitado', () => {
    expect(botonAuthDeshabilitado({ modo: 'signup', aceptaPolitica: true, procesando: true })).toBe(true)
  })

  it('sin argumentos → usa defaults (login, sin nada) → HABILITADO', () => {
    expect(botonAuthDeshabilitado()).toBe(false)
  })
})
