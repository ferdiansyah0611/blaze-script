import { render, state, init } from "@blaze";

const Navbar = function () {
    init(this);
    render(
        () => (
            <>
                <nav class="bg-purple-600 text-white w-full flex sticky top-0 justify-center items-center px-8 space-x-4">
                    <p class="p-4 flex-1 font-bold">Blaze Script</p>
                    <a class="p-4" data-link href="/">Index</a>
                    <a class="p-4" data-link href="/home">Home</a>
                </nav>
            </>
        ),
        this
    );
};


export default Navbar