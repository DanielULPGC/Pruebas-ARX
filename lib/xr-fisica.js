import * as THREE from "three";

export class CaidaFisica3D {
  constructor(malla, yDestino, alEncajar) {
    this.malla = malla;
    this.yDestino = yDestino;
    this.vy = 0;
    this.alEncajar = alEncajar;
    this.terminado = false;
  }
  step(dt) {
    if (this.terminado) return;
    this.vy -= 9.8 * dt;
    this.malla.position.y += this.vy * dt;
    if (this.malla.position.y <= this.yDestino) {
      this.malla.position.y = this.yDestino;
      if (Math.abs(this.vy) > 0.6) {
        this.vy = -this.vy * 0.25;
      } else {
        this.terminado = true;
        this.vy = 0;
        if (this.alEncajar) this.alEncajar();
      }
    }
  }
}
