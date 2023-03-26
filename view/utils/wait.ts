const wait = (delay: number) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
};

export default wait;