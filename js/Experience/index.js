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
        amplitude: 1,
        spin: 3,
        branches: -3,
        randomness: 0.2,
        randomnessPower: 3,
      },
      {
        minRadius: 0.4,
        maxRadius: 1.6,
        color: '#88b3ce',
        size: 0.7,
        count: 10000,
        amplitude: 2,
        spin: 6,
        branches: 3,
        randomness: 0.25,
        randomnessPower: 3,
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
    this.setRaycaster()
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

    this.onPointerMove = this.onPointerMove.bind(this)
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

      const spinAngle = radius * layer.spin
      const branchAngle = ((i % layer.branches) / layer.branches) * theta

      const randomX =
        Math.pow(Math.random(), layer.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        layer.randomness *
        radius
      const randomY =
        Math.pow(Math.random(), layer.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        layer.randomness *
        radius
      const randomZ =
        Math.pow(Math.random(), layer.randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        layer.randomness *
        radius

      const x = radius * Math.sin(branchAngle + spinAngle) + randomX
      const y = randomY //(Math.random() - 0.5) * 0.05
      const z = radius * Math.cos(branchAngle + spinAngle) + randomZ
      positions.set([x, y, z], i * 3)

      // const theta = Math.random() * Math.PI * 2 // angle
      // const radius = lerp(minRadius, maxRadius, Math.random())

      // const x = radius * Math.sin(theta)
      // const y = (Math.random() - 0.5) * 0.05
      // const z = radius * Math.cos(theta)
      // positions.set([x, y, z], i * 3)
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
        uAmplitude: { value: layer.amplitude },
        uMouse: { value: new THREE.Vector2() },
        uSize: { value: layer.size },
        uTexture: { value: this.particleTexture },
        uColor: { value: new THREE.Color(layer.color) },
        uResolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      vertexShader: galaxyVertex,
      fragmentShader: galaxyFragment,
    })

    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)
    this.galaxy = new THREE.Mesh(this.galaxyGeometry, material)

    this.materials.push(material)
    this.scene.add(this.galaxy)
  }

  //////////////////////////////////////////////////////////////////////////////

  onPointerMove(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

    // Checking up the ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera)

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects([this.planeRay])
    if (intersects[0]) {
      this.sphereRay?.position.copy(intersects[0].point)
      this.point.copy(intersects[0].point)
    }
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
  setRaycaster() {
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.point = new THREE.Vector3()

    // Plane raycaster to catch the mouse position
    this.planeRay = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10, 10, 10, 10).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    )
    this.planeRay.name = 'planeRay'
    this.planeRay.visible = false
    this.scene.add(this.planeRay)

    // Debug
    // this.sphereRay = new THREE.Mesh(
    //   new THREE.SphereBufferGeometry(0.1, 10, 10),
    //   new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    // )
    // this.sphereRay.name = 'sphereRay'
    // this.scene.add(this.sphereRay)

    window.addEventListener('pointermove', this.onPointerMove)
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
        material.uniforms.uMouse.value = this.point
      })
    }
  }

  update(_) {
    // Update time
    this.time += 0.05

    // Update galaxy
    this.updateGalaxy()

    // Update controls
    this.controls.update()

    // Render
    this.renderer.render(this.scene, this.camera)

    // Call update again on the next frame
    window.requestAnimationFrame(this.update)
  }
}

export default Experience
