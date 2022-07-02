import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import galaxyFragment from './shaders/galaxy/fragment.glsl'
import galaxyVertex from './shaders/galaxy/vertex.glsl'

import particleTextureSrc from '../../assets/circle_05_small.png'

import { lerp } from './utils/math'

class Experience {
  constructor(options) {
    this.container = options.domElement
    this.scene = new THREE.Scene()
    this.textureLoader = new THREE.TextureLoader()
    this.time = 0.0

    this.materials = []
    this.layers = [
      {
        minRadius: 0.3,
        maxRadius: 1.5,
        color: '#f7b373',
        size: 1,
        count: 10000,
      },
      {
        minRadius: 0.3,
        maxRadius: 1.5,
        color: '#88b3ce',
        size: 0.6,
        count: 10000,
      },
    ]

    this.init()
  }

  /**
   * Experience setup
   */
  async init() {
    this.bind()

    await this.setTexture()

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

  addLayer(layer) {
    const count = layer.count
    const minRadius = layer.minRadius
    const maxRadius = layer.maxRadius
    const positions = new Float32Array(count * 3)

    this.particlesGeometry = new THREE.PlaneBufferGeometry()

    this.galaxyGeometry = new THREE.InstancedBufferGeometry()
    this.galaxyGeometry.setAttribute(
      'position',
      this.particlesGeometry.attributes.position
    )
    this.galaxyGeometry.instanceCount = count
    this.galaxyGeometry.index = this.particlesGeometry.index

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2 // angle
      const radius = lerp(minRadius, maxRadius, Math.random())

      const x = radius * Math.sin(theta)
      const y = (Math.random() - 0.5) * 0.05
      const z = radius * Math.cos(theta)
      positions.set([x, y, z], i * 3)
    }

    this.galaxyGeometry.setAttribute(
      'aPositions',
      new THREE.InstancedBufferAttribute(positions, 3, false)
    )

    const material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: layer.size },
        uTexture: { value: this.particleTexture },
        uColor: { value: new THREE.Color(layer.color) },
        uResolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: galaxyVertex,
      fragmentShader: galaxyFragment,
    })

    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)
    this.galaxy = new THREE.Mesh(this.galaxyGeometry, material)

    this.materials.push(material)
    this.scene.add(this.galaxy)
  }

  //////////////////////////////////////////////////////////////////////////////

  async setTexture() {
    const texture = await this.textureLoader.loadAsync(particleTextureSrc)
    this.particleTexture = texture
  }

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
    this.layers.forEach((layer) => this.addLayer(layer))
  }

  //////////////////////////////////////////////////////////////////////////////

  updateGalaxy() {
    if (this.galaxy) {
      this.materials.forEach((material) => {
        material.uniforms.uTime.value = this.time * 0.5
      })
    }
  }

  update(_) {
    // Update time
    this.time += 0.05

    // Update galaxy
    this.updateGalaxy()
    // if (this.galaxy) {
    //   this.galaxy.material.uniforms.uTime.value = this.time * 0.6
    // }

    // Update controls
    this.controls.update()

    // Render
    this.renderer.render(this.scene, this.camera)

    // Call update again on the next frame
    window.requestAnimationFrame(this.update)
  }
}

export default Experience
