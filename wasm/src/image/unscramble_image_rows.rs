use wasm_bindgen::prelude::*;
use image::{DynamicImage, GenericImage, GenericImageView, ImageFormat};
use std::io::Cursor;

fn load_image(image: &[u8]) -> DynamicImage {
    image::load_from_memory(image).expect("Failed to load image")
}

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct RowBlock {
    pub dy: u32,
    pub height: u32,
}

#[wasm_bindgen]
impl RowBlock {
    #[wasm_bindgen(constructor)]
    pub fn new(dy: u32, height: u32) -> RowBlock {
        RowBlock { dy, height }
    }
}

fn do_unscramble_image_rows(
    image_data: &[u8],
    blocks: &[RowBlock],
) -> Result<Vec<u8>, String> {
    let img = load_image(image_data);
    let (img_width, img_height) = img.dimensions();

    let mut dst = DynamicImage::new_rgba8(img_width, img_height);
    let mut sy = 0;

    for block in blocks {
        let RowBlock { dy, height } = block;

        if sy + height > img_height || dy + height > img_height {
            return Err(format!(
                "Block out of bounds: sy={}, dy={}, height={}, img_height={}",
                sy, dy, height, img_height
            ));
        }

        let cropped = img.crop_imm(0, sy, img_width, *height);
        dst.copy_from(&cropped, 0, *dy)
            .map_err(|e| format!("copy_from error: {:?}", e))?;

        sy += height;
    }

    let mut out = Vec::new();
    {
        let mut cursor = Cursor::new(&mut out);
        dst.write_to(&mut cursor, ImageFormat::Jpeg)
            .map_err(|e| e.to_string())?;
    }

    Ok(out)
}

#[wasm_bindgen]
pub fn unscramble_image_rows_sync(
    image_data: Vec<u8>,
    blocks: js_sys::Array,
) -> Result<Box<[u8]>, JsValue> {
    // Chuyển mảng JS -> Vec<RowBlock>
    let blocks: Vec<RowBlock> = blocks
        .iter()
        .map(|b| {
            let obj = js_sys::Object::from(b);
            let dy = js_sys::Reflect::get(&obj, &JsValue::from_str("dy"))
                .unwrap()
                .as_f64()
                .unwrap() as u32;
            let height = js_sys::Reflect::get(&obj, &JsValue::from_str("height"))
                .unwrap()
                .as_f64()
                .unwrap() as u32;
            RowBlock { dy, height }
        })
        .collect();

    match do_unscramble_image_rows(&image_data, &blocks) {
        Ok(vec) => Ok(vec.into_boxed_slice()),
        Err(e) => Err(JsValue::from_str(&e)),
    }
}
