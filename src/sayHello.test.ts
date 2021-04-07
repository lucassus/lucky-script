import { sayHello } from "./sayHello";

describe(".sayHello", () => {
  it("says hello with the given name", () => {
    expect(sayHello("Luke")).toEqual("Hello Luke!");
    expect(sayHello("Mike")).toEqual("Hello Mike!");
  });
});
