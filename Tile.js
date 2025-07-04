export default class Tile {
  #tileElement
  #x
  #y
  #value

  constructor(tileContainer, value = Math.random() > 0.5 ? 2 : 4) {
    this.#tileElement = document.createElement("div")
    this.#tileElement.classList.add("tile")
    tileContainer.append(this.#tileElement)
    this.value = value
  }

  get value() {
    return this.#value
  }

  set value(v) {
    this.#value = v
    this.#tileElement.textContent = v
    // const power = Math.log2(v)

    //   const backgroundLightness = 100 - power * 9
    // this.#tileElement.style.setProperty(
    //   "--background-lightness",
    //   `${backgroundLightness}%`
    // )
    // this.#tileElement.style.setProperty(
    //   "--text-lightness",
    //   `${backgroundLightness <= 50 ? 90 : 10}%`
    // )  
    
      switch (v) {
      case 2:
        this.#tileElement.style.setProperty(
      "--block-color",
      '71,254,251'
    )
        break;
      case 4:
        this.#tileElement.style.setProperty(
      "--block-color",
      '121, 255, 117'
    )
        break;
      case 8:
        this.#tileElement.style.setProperty(
      "--block-color",
      '255, 104, 192'
    )
        break;
      case 16:
        this.#tileElement.style.setProperty(
      "--block-color",
      '255, 243, 111'
    )
        break;
      case 32:
        this.#tileElement.style.setProperty(
      "--block-color",
      '124, 255, 233'
    )
        break;
      case 64:
        this.#tileElement.style.setProperty(
      "--block-color",
      '255, 141, 121'
    )
        break;
      case 128:
        this.#tileElement.style.setProperty(
      "--block-color",
      '215, 147, 255'
    )
        break;
      case 256:
        this.#tileElement.style.setProperty(
      "--block-color",
      '255, 192, 203'
    )
        break;
      case 512:
        this.#tileElement.style.setProperty(
      "--block-color",
      '255, 206, 114'
    )
        break;
      case 1024:
        this.#tileElement.style.setProperty(
      "--block-color",
      '157, 255, 157'
    )
        break;
      case 2048:
        this.#tileElement.style.setProperty(
      "--block-color",
      '255, 255, 255'
    )
        break;
    
      default:
        this.#tileElement.style.setProperty(
      "--block-color",
      '255, 255, 255'
    )
        break;
    }
  }

  set x(value) {
    this.#x = value
    this.#tileElement.style.setProperty("--x", value)
  }

  set y(value) {
    this.#y = value
    this.#tileElement.style.setProperty("--y", value)
  }

  remove() {
    this.#tileElement.remove()
  }

  waitForTransition(animation = false) {
    return new Promise(resolve => {
      this.#tileElement.addEventListener(
        animation ? "animationend" : "transitionend",
        resolve,
        {
          once: true,
        }
      )
    })
  }
}
