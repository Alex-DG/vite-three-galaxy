import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import galaxyFragment from './shaders/galaxy/fragment.glsl'
import galaxyVertex from './shaders/galaxy/vertex.glsl'

class Experience {
  constructor(options) {
    this.scene = new THREE.Scene()
    this.container = options.domElement
    this.init()
  }

  /**
   * Experience setup
   */
  init() {
    this.bind()
    this.setSizes()
    this.setRenderer()
    this.setCamera()
    this.setGalaxy()
    this.setResize()
    this.update()

    console.log('🤖', 'Experience initialized')
  }

  bind() {
    this.resize = this.resize.bind(this)
    this.update = this.update.bind(this)
  }

  resize() {
    // Update sizes
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height
    this.camera.updateProjectionMatrix()

    // Update renderer
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  //////////////////////////////////////////////////////////////////////////////

  setSizes() {
    this.sizes = {
      width: this.container.offsetWidth,
      height: this.container.offsetHeight || window.innerHeight,
    }
  }

  setCamera() {
    // Base camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    )
    this.camera.position.set(0, 2, 2)
    this.scene.add(this.camera)

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.container.appendChild(this.renderer.domElement)
  }

  setCube() {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial()
    )
    this.scene.add(cube)
  }

  setResize() {
    window.addEventListener('resize', this.resize)
  }

  setGalaxy() {
    const count = 10000

    this.particlesGeometry = new THREE.PlaneBufferGeometry()

    this.galaxyGeometry = new THREE.InstancedBufferGeometry()
    this.galaxyGeometry.setAttribute(
      'position',
      this.particlesGeometry.attributes.position
    )
    this.galaxyGeometry.instanceCount = count
    this.galaxyGeometry.index = this.particlesGeometry.index

    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 5.5
      const y = (Math.random() - 0.5) * 5.5
      const z = (Math.random() - 0.5) * 5.5
      positions.set([x, y, z], i * 3)
    }

    this.galaxyGeometry.setAttribute(
      'positions',
      new THREE.InstancedBufferAttribute(positions, 3, false)
    )

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: galaxyVertex,
      fragmentShader: galaxyFragment,
    })

    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)
    this.points = new THREE.Mesh(this.galaxyGeometry, this.material)
    this.scene.add(this.points)
  }

  //////////////////////////////////////////////////////////////////////////////

  update() {
    // Update controls
    this.controls.update()

    // Render
    this.renderer.render(this.scene, this.camera)

    // Call update again on the next frame
    window.requestAnimationFrame(this.update)
  }
}

export default Experience
